//Doubly Linked List Node

class DoublyLinkedListNode {
    constructor(order) {
        this.order = order;
        this.next = null;
        this.prev = null;
    }
}

// Doubly Linked List
class OrderDoublyLinkedList {
    constructor() {
        this.head = null;
        this.tail = null;
    }
    append(order) {
        const newNode = new DoublyLinkedListNode(order);

        if (!this.head) {
            this.head = newNode;
            this.tail = newNode;
            return;
        }
        this.tail.next = newNode;
        newNode.prev = this.tail;
        this.tail = newNode;
    }
    toArray() {
        const orders = [];
        let current = this.head;

        while (current) {
            orders.push(current.order);
            current = current.next;
        }

        return orders;
    }
}

//Binary Tree Node
class BinaryTreeNode {
    constructor(data) {
        this.data = data;
        this.left = null;
        this.right = null;
    }
}
//Binary Search Tree
class BinarySearchTree {
    constructor(getSortValue) {
        this.root = null;
        this.getSortValue = getSortValue;
    }
    insert (data) {
        const newNode = new BinaryTreeNode(data);

        if (!this.root) {
            this.root = newNode;
            return;
        }
        this.insertNode(this.root, newNode);
    }

    insertNode(currentNode, newNode) {
        const currentValue = this.getSortValue(currentNode.data);
        const newValue = this.getSortValue(newNode.data);

        if (newValue < currentValue) {
            if (!currentNode.left) {
                currentNode.left = newNode;
            } else {
                this.insertNode(currentNode.left, newNode);
            }
        } else {
            if (!currentNode.right) {
                currentNode.right = newNode;
            } else {
                this.insertNode(currentNode.right, newNode);
            }
        }
    }

    inOrderTraversal(node = this.root, result = []) {
        if (node) {
            this.inOrderTraversal(node.left, result);
            result.push(node.data);
            this.inOrderTraversal(node.right, result);
        }

        return result;
    }
}
function getValueByField(item, sortBy) {
    const value = item?.[sortBy];

    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'boolean') {
        return value ? 1 : 0;
    }
    if (value === undefined || value === null) {
        return '';
    }

    return String(value).toLowerCase();
}

export function sortWithDataStructures(data, sortBy, direction = 'asc') {
    if (!Array.isArray(data)) {
        return []
    }

    const linkedList = new OrderDoublyLinkedList()

    data.forEach(item => {
        linkedList.append(item);
    });
    const listData = linkedList.toArray();

    const tree = new BinarySearchTree(item => getValueByField(item, sortBy));

    listData.forEach(item => {
        tree.insert(item);
    });

    const sortedData = tree.inOrderTraversal();

    if (direction === 'desc') {
        return sortedData.reverse()
    }

    return sortedData;
}
