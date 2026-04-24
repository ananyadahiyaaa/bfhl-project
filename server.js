const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

function processEdges(edges) {
    const graph = {};
    const childSet = new Set();

    edges.forEach(e => {
        const [p, c] = e.split("->");
        if (!graph[p]) graph[p] = [];
        graph[p].push(c);
        childSet.add(c);
    });

    const nodes = new Set();
    edges.forEach(e => {
        const [p, c] = e.split("->");
        nodes.add(p);
        nodes.add(c);
    });

    let roots = [...nodes].filter(n => !childSet.has(n));
    if (roots.length === 0) roots = [...nodes].sort().slice(0,1);

    function dfs(node, visited) {
        if (visited.has(node)) return null;
        visited.add(node);

        let children = graph[node] || [];
        let obj = {};

        for (let c of children) {
            const sub = dfs(c, new Set(visited));
            if (sub === null) return null;
            obj[c] = sub;
        }
        return obj;
    }

    let results = [];

    roots.forEach(root => {
        let tree = dfs(root, new Set());

        if (tree === null) {
            results.push({
                root,
                tree: {},
                has_cycle: true
            });
        } else {
            function depth(node) {
                if (!graph[node] || graph[node].length === 0) return 1;
                return 1 + Math.max(...graph[node].map(depth));
            }

            results.push({
                root,
                tree: { [root]: tree },
                depth: depth(root)
            });
        }
    });

    return results;
}

app.post('/bfhl', (req, res) => {
    const data = req.body.data || [];

    const regex = /^[A-Z]->[A-Z]$/;

    let valid = new Set();
    let duplicates = new Set();
    let invalid = [];

    data.forEach(item => {
        const t = item.trim();

        if (!regex.test(t) || t[0] === t[3]) {
            invalid.push(item);
        } else {
            if (valid.has(t)) duplicates.add(t);
            else valid.add(t);
        }
    });

    const edges = [...valid];
    const hierarchies = processEdges(edges);

    const total_cycles = hierarchies.filter(h => h.has_cycle).length;
    const total_trees = hierarchies.filter(h => !h.has_cycle).length;

    let largest = "";
    let maxDepth = 0;

    hierarchies.forEach(h => {
        if (h.depth && h.depth > maxDepth) {
            maxDepth = h.depth;
            largest = h.root;
        }
    });

    res.json({
        user_id: "ananyadahiya_ddmmyyyy", // update later
        email_id: "yourmail@srmist.edu.in",
        college_roll_number: "yourroll",
        hierarchies,
        invalid_entries: invalid,
        duplicate_edges: [...duplicates],
        summary: {
            total_trees,
            total_cycles,
            largest_tree_root: largest
        }
    });
});

app.listen(3000, () => console.log("Server running on port 3000"));