(*---
description: A script that prints 1 + 2 runs on the ECMAScript semantics that port engine262 to TLA+.
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
---- MODULE print_sum ----
EXTENDS ESCore
\* print(1 + 2);
ASSUME PrintT(RunFrom(HarnessResult(<<>>, <<>>), <<[type |-> "Script", strict |-> FALSE, ScriptBody |-> [type |-> "ScriptBody", strict |-> FALSE, StatementList |-> <<[type |-> "ExpressionStatement", strict |-> FALSE, Expression |-> [type |-> "CallExpression", strict |-> FALSE, CallExpression |-> [type |-> "IdentifierReference", name |-> <<112, 114, 105, 110, 116>>, strict |-> FALSE], Arguments |-> <<[type |-> "AdditiveExpression", strict |-> FALSE, MultiplicativeExpression |-> [type |-> "NumericLiteral", value |-> [type |-> "number", value |-> [i |-> 2, e |-> 0, k |-> "int", neg |-> FALSE, m |-> <<>>]], strict |-> FALSE], operator |-> "+", AdditiveExpression |-> [type |-> "NumericLiteral", value |-> [type |-> "number", value |-> [i |-> 1, e |-> 0, k |-> "int", neg |-> FALSE, m |-> <<>>]], strict |-> FALSE]]>>, isTail |-> FALSE]]>>]]>>, <<>>, TRUE, <<>>))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | [name |-> <<>>, out |-> <<<<51>>>>, ok |-> TRUE, message |-> <<>>]
    2190:0 Finished computing initial states: 0 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
