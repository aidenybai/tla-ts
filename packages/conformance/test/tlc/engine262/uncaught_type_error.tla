(*---
description: A script that throws a TypeError ends abruptly on the ECMAScript semantics that port engine262 to TLA+, which name the thrown error.
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
---- MODULE uncaught_type_error ----
EXTENDS ESCore
\* throw new TypeError("boom");
ASSUME PrintT(RunFrom(HarnessResult(<<>>, <<>>), <<[type |-> "Script", strict |-> FALSE, ScriptBody |-> [type |-> "ScriptBody", strict |-> FALSE, StatementList |-> <<[type |-> "ThrowStatement", strict |-> FALSE, Expression |-> [type |-> "NewExpression", strict |-> FALSE, MemberExpression |-> [type |-> "IdentifierReference", name |-> <<84, 121, 112, 101, 69, 114, 114, 111, 114>>, strict |-> FALSE], Arguments |-> <<[type |-> "StringLiteral", value |-> <<98, 111, 111, 109>>, strict |-> FALSE]>>]]>>]]>>, <<>>, TRUE, <<>>))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | [ name |-> <<84, 121, 112, 101, 69, 114, 114, 111, 114>>,
    |   out |-> <<>>,
    |   ok |-> FALSE,
    |   message |->
    |       <<84, 121, 112, 101, 69, 114, 114, 111, 114, 58, 32, 98, 111, 111, 109>> ]
    2190:0 Finished computing initial states: 0 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
