/**
 * Given a recipe, create goods tree. Each node represents a good to acquire.
 * There are several ways to aquire a good: produce, buy or steal.
 * Processing a node, an agent decides which way of aquisition to choose.
 * The decision is made based on context, like market prices, skills and tools at agent's disposal.
 * As context changes dynamically, agent must evaluate option costs at the time he starts process a node in question.
 * Agent processes a goods tree from the root the the leaves.
 * Processing a node, the agent checks wether child nodes are fulfilled and schedules a cheapest task.
 * Agent re-evaluates a tree and schedules a new task when prev task was completed.
 */

import { Market } from '../market'
import {
  BuyTask,
  GenericProductionTask,
  Good,
  GoodTag,
  GoodsContainer,
  RECIPES,
  Task,
} from './recieps'

export interface ReqsTreeNode extends Good {
  children?: ReqsTreeNode[]
}

// Actually, a tree could be prefabricated and reused.
export function buildRequirementsTreeFor(tag: GoodTag): ReqsTreeNode {
  const root: ReqsTreeNode = { tag, amount: 1 }
  buildChildrenOf(root)
  return root
}

function buildChildrenOf(node: ReqsTreeNode): undefined {
  const recipe = RECIPES[node.tag]
  const components = recipe.components
  if (components === undefined) return

  node.children = []
  for (const componentOptions of components) {
    // Just pick a first option for now.
    const option = componentOptions[0]
    const reqNode: ReqsTreeNode = {
      tag: option.tag,
      amount: option.amount,
    }
    buildChildrenOf(reqNode)
    node.children.push(reqNode)
  }
}

export interface EstimationContext {
  readonly skill: Partial<Record<GoodTag, number | undefined>>
  readonly projects: Partial<Record<GoodTag, number>>
  readonly assets: GoodsContainer
  readonly market?: Market
}

/**
 * Get cheapest action.
 * Aquisition action cost:
 *  'produce' -> manhours cost * skill + (children costs - fullfilled children manhours)
 *  'buy' -> price
 */
export function evalBestAction(
  good: ReqsTreeNode,
  context: EstimationContext
): 'produce' | 'buy' | 'unavailable' {
  const productionCost = estimateProduce(good, context)
  const buyCost = estimateBuy(good, context)
  if (buyCost === undefined && productionCost === undefined)
    return 'unavailable'
  if (buyCost !== undefined && productionCost === undefined) return 'buy'
  if (productionCost !== undefined && buyCost === undefined) return 'produce'
  return productionCost! < buyCost! ? 'produce' : 'buy'
}

function estimateBestCost(
  good: ReqsTreeNode,
  context: EstimationContext
): number | undefined {
  const productionCost = estimateProduce(good, context)
  const buyCost = estimateBuy(good, context)
  if (buyCost === undefined) return productionCost
  if (productionCost === undefined) return undefined
  return Math.min(productionCost, buyCost)
}

// TODO: consider it estimates to produce ONE required good, but estimate to buy ALL required goods.
function estimateProduce(
  good: ReqsTreeNode,
  context: EstimationContext
): number | undefined {
  const recipe = RECIPES[good.tag]
  if (context.projects[good.tag] !== undefined)
    return context.projects[good.tag]
  // Assume agent has tech knowledge and skill of level 1.
  let cost = Math.ceil((recipe.manhours / recipe.yield) * good.amount)
  if (good.children === undefined) return cost
  for (const child of good.children) {
    const childCost = estimateBestCost(child, context)
    if (childCost === undefined) return undefined
    cost += childCost
  }
  return cost
}

export function estimateBaselineProductionCost(good: ReqsTreeNode): number {
  const recipe = RECIPES[good.tag]
  let cost = recipe.manhours
  if (good.children === undefined) return cost
  for (const child of good.children) {
    cost += estimateBaselineProductionCost(child)
  }
  return cost
}

function estimateBuy(
  target: Good,
  context: EstimationContext
): number | undefined {
  if (context.market === undefined) return undefined
  const prices = context.market.getPricesFor(target.tag)
  // price = 10 -> must pay 10 your goods to buy 1 target good.
  // price = 0.1 -> must pay 1 your good to buy 10 target goods.
  // return target.amount * price
  // Try to find best deal by prices vs weighted inventory.
  return undefined
}

export function evalBestTask(
  node: ReqsTreeNode,
  context: EstimationContext
): Task {
  const action = evalBestAction(node, context)
  const recipe = RECIPES[node.tag]

  switch (action) {
    case 'unavailable':
      throw new Error('Unavailable')
    case 'produce':
      const produceNodeTask = new GenericProductionTask(
        recipe.manhours,
        {
          tag: recipe.tag,
          amount: recipe.yield,
        },
        node.children ?? []
      )

      // Has project -> continue.
      if (context.projects[node.tag] !== undefined) {
        return produceNodeTask
      }
      // Dfs unfulfilled node.
      for (const child of node.children ?? []) {
        if (!context.assets.has(child.tag, child.amount)) {
          return evalBestTask(child, context)
        }
      }
      // All children are fulfilled -> produce.
      return produceNodeTask
    case 'buy':
      if (context.market === undefined) throw new Error('Missing market')
      return new BuyTask(context.market, {
        tag: recipe.tag,
        amount: recipe.yield,
      })
    default:
      const e: never = action
      throw new RangeError(e)
  }
}
