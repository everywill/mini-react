Implementing react's main features in both ways: [stack](https://github.com/everywill/mini-react/tree/feature/stack), [fiber](https://github.com/everywill/mini-react/tree/feature/fiber). Click to check details.

Mini-react of both vrsion export `createElement`, `Component`, `render`;  `useState`is also exported in fiber version. 



#### stack

Implement diff-algo  in a very straightforward  recursIve way. 



#### fiber

Based on stack version and reImplement reconcilation with loop, introducing fiber to restore the processing state . The dom related operations are extracted.
