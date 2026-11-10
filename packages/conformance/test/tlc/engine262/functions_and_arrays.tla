(*---
description: A script with a recursive function, an arrow function, Array.prototype.map and join runs on the ECMAScript semantics that port engine262 to TLA+.
outcome: success
stack: 64m
config: |
  CONSTANTS None = None Empty = Empty Absent = Absent
includes:
  - ESBigNat.tla
  - ESCore.tla
  - ESNames.tla
  - ESNumber.tla
---*)
---- MODULE functions_and_arrays ----
EXTENDS ESCore
\* function fib(n) { return n < 2 ? n : fib(n - 1) + fib(n - 2); }
\* const squares = [1, 2, 3].map((x) => x * x);
\* print(fib(6) + ":" + squares.join(","));
ASSUME PrintT(RunFrom(HarnessResult(<<>>, <<>>), <<[type |-> "Script", strict |-> FALSE, ScriptBody |-> [type |-> "ScriptBody", strict |-> FALSE, StatementList |-> <<[type |-> "FunctionDeclaration", strict |-> FALSE, sourceText |-> <<102, 117, 110, 99, 116, 105, 111, 110, 32, 102, 105, 98, 40, 110, 41, 32, 123, 32, 114, 101, 116, 117, 114, 110, 32, 110, 32, 60, 32, 50, 32, 63, 32, 110, 32, 58, 32, 102, 105, 98, 40, 110, 32, 45, 32, 49, 41, 32, 43, 32, 102, 105, 98, 40, 110, 32, 45, 32, 50, 41, 59, 32, 125>>, BindingIdentifier |-> [type |-> "BindingIdentifier", name |-> <<102, 105, 98>>, strict |-> FALSE], site |-> 1, FunctionBody |-> [type |-> "FunctionBody", strict |-> FALSE, FunctionStatementList |-> <<[type |-> "ReturnStatement", strict |-> FALSE, Expression |-> [type |-> "ConditionalExpression", strict |-> FALSE, ShortCircuitExpression |-> [type |-> "RelationalExpression", strict |-> FALSE, operator |-> "<", ShiftExpression |-> [type |-> "NumericLiteral", value |-> [type |-> "number", value |-> [i |-> 2, e |-> 0, k |-> "int", neg |-> FALSE, m |-> <<>>]], strict |-> FALSE], PrivateIdentifier |-> None, RelationalExpression |-> [type |-> "IdentifierReference", name |-> <<110>>, strict |-> FALSE]], AssignmentExpression_a |-> [type |-> "IdentifierReference", name |-> <<110>>, strict |-> FALSE], AssignmentExpression_b |-> [type |-> "AdditiveExpression", strict |-> FALSE, MultiplicativeExpression |-> [type |-> "CallExpression", strict |-> FALSE, CallExpression |-> [type |-> "IdentifierReference", name |-> <<102, 105, 98>>, strict |-> FALSE], Arguments |-> <<[type |-> "AdditiveExpression", strict |-> FALSE, MultiplicativeExpression |-> [type |-> "NumericLiteral", value |-> [type |-> "number", value |-> [i |-> 2, e |-> 0, k |-> "int", neg |-> FALSE, m |-> <<>>]], strict |-> FALSE], operator |-> "-", AdditiveExpression |-> [type |-> "IdentifierReference", name |-> <<110>>, strict |-> FALSE]]>>, isTail |-> FALSE], operator |-> "+", AdditiveExpression |-> [type |-> "CallExpression", strict |-> FALSE, CallExpression |-> [type |-> "IdentifierReference", name |-> <<102, 105, 98>>, strict |-> FALSE], Arguments |-> <<[type |-> "AdditiveExpression", strict |-> FALSE, MultiplicativeExpression |-> [type |-> "NumericLiteral", value |-> [type |-> "number", value |-> [i |-> 1, e |-> 0, k |-> "int", neg |-> FALSE, m |-> <<>>]], strict |-> FALSE], operator |-> "-", AdditiveExpression |-> [type |-> "IdentifierReference", name |-> <<110>>, strict |-> FALSE]]>>, isTail |-> FALSE]]]]>>, mayUseArguments |-> FALSE], FormalParameters |-> <<[type |-> "SingleNameBinding", strict |-> FALSE, BindingIdentifier |-> [type |-> "BindingIdentifier", name |-> <<110>>, strict |-> FALSE], Initializer |-> None]>>], [type |-> "LexicalDeclaration", strict |-> FALSE, BindingList |-> <<[type |-> "LexicalBinding", strict |-> FALSE, BindingIdentifier |-> [type |-> "BindingIdentifier", name |-> <<115, 113, 117, 97, 114, 101, 115>>, strict |-> FALSE], BindingPattern |-> None, Initializer |-> [type |-> "CallExpression", strict |-> FALSE, CallExpression |-> [type |-> "MemberExpression", strict |-> FALSE, Expression |-> None, MemberExpression |-> [type |-> "ArrayLiteral", strict |-> FALSE, ElementList |-> <<[type |-> "NumericLiteral", value |-> [type |-> "number", value |-> [i |-> 1, e |-> 0, k |-> "int", neg |-> FALSE, m |-> <<>>]], strict |-> FALSE], [type |-> "NumericLiteral", value |-> [type |-> "number", value |-> [i |-> 2, e |-> 0, k |-> "int", neg |-> FALSE, m |-> <<>>]], strict |-> FALSE], [type |-> "NumericLiteral", value |-> [type |-> "number", value |-> [i |-> 3, e |-> 0, k |-> "int", neg |-> FALSE, m |-> <<>>]], strict |-> FALSE]>>], PrivateIdentifier |-> None, IdentifierName |-> [type |-> "IdentifierName", name |-> <<109, 97, 112>>, strict |-> FALSE]], Arguments |-> <<[type |-> "ArrowFunction", strict |-> FALSE, sourceText |-> <<40, 120, 41, 32, 61, 62, 32, 120, 32, 42, 32, 120>>, ConciseBody |-> [type |-> "ConciseBody", strict |-> FALSE, ExpressionBody |-> [type |-> "ExpressionBody", strict |-> FALSE, AssignmentExpression |-> [type |-> "MultiplicativeExpression", strict |-> FALSE, ExponentiationExpression |-> [type |-> "IdentifierReference", name |-> <<120>>, strict |-> FALSE], MultiplicativeOperator |-> "*", MultiplicativeExpression |-> [type |-> "IdentifierReference", name |-> <<120>>, strict |-> FALSE]]]], ArrowParameters |-> <<[type |-> "SingleNameBinding", strict |-> FALSE, BindingIdentifier |-> [type |-> "BindingIdentifier", name |-> <<120>>, strict |-> FALSE], Initializer |-> None]>>]>>, isTail |-> FALSE]]>>, LetOrConst |-> "const"], [type |-> "ExpressionStatement", strict |-> FALSE, Expression |-> [type |-> "CallExpression", strict |-> FALSE, CallExpression |-> [type |-> "IdentifierReference", name |-> <<112, 114, 105, 110, 116>>, strict |-> FALSE], Arguments |-> <<[type |-> "AdditiveExpression", strict |-> FALSE, MultiplicativeExpression |-> [type |-> "CallExpression", strict |-> FALSE, CallExpression |-> [type |-> "MemberExpression", strict |-> FALSE, Expression |-> None, MemberExpression |-> [type |-> "IdentifierReference", name |-> <<115, 113, 117, 97, 114, 101, 115>>, strict |-> FALSE], PrivateIdentifier |-> None, IdentifierName |-> [type |-> "IdentifierName", name |-> <<106, 111, 105, 110>>, strict |-> FALSE]], Arguments |-> <<[type |-> "StringLiteral", value |-> <<44>>, strict |-> FALSE]>>, isTail |-> FALSE], operator |-> "+", AdditiveExpression |-> [type |-> "AdditiveExpression", strict |-> FALSE, MultiplicativeExpression |-> [type |-> "StringLiteral", value |-> <<58>>, strict |-> FALSE], operator |-> "+", AdditiveExpression |-> [type |-> "CallExpression", strict |-> FALSE, CallExpression |-> [type |-> "IdentifierReference", name |-> <<102, 105, 98>>, strict |-> FALSE], Arguments |-> <<[type |-> "NumericLiteral", value |-> [type |-> "number", value |-> [i |-> 6, e |-> 0, k |-> "int", neg |-> FALSE, m |-> <<>>]], strict |-> FALSE]>>, isTail |-> FALSE]]]>>, isTail |-> FALSE]]>>]]>>, <<>>, TRUE, <<>>))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | [ name |-> <<>>,
    |   out |-> <<<<56, 58, 49, 44, 52, 44, 57>>>>,
    |   ok |-> TRUE,
    |   message |-> <<>> ]
    2190:0 Finished computing initial states: 0 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
