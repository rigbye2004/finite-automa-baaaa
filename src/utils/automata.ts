import type { Node, Edge } from 'reactflow'

export function findAllPaths(nodes: Node[], edges: Edge[]): string[][] {
  const allPaths: string[][] = []
  const startNode = nodes.find(n => n.data.isStart)
  const acceptingNodes = nodes.filter(n => n.data.isAccepting).map(n => n.id)

  if (!startNode || acceptingNodes.length === 0) return allPaths

  const traverse = (currentNode: string, path: string[], visited: Set<string>) => {
    if (acceptingNodes.includes(currentNode) && path.length > 0) {
      allPaths.push([...path])
    }

    if (path.length >= 10) return

    edges.forEach((edge) => {
      if (edge.source === currentNode && edge.data?.sheep) {
        const visitKey = `${edge.id}-${path.length}`
        if (!visited.has(visitKey)) {
          visited.add(visitKey)
          path.push(edge.data.sheep)
          traverse(edge.target, path, visited)
          path.pop()
          visited.delete(visitKey)
        }
      }
    })
  }

  traverse(startNode.id, [], new Set())
  return allPaths
}

export function pathsMatch(path1: string[], path2: string[]): boolean {
  if (path1.length !== path2.length) return false
  return path1.every((sheep, index) => sheep === path2[index])
}

export function calculateStars(percentage: number): 1 | 2 | 3 {
  if (percentage >= 0.9) return 3
  if (percentage >= 0.7) return 2
  return 1
}
