(*---
description: Without the flag, the linter warns about a record field named like a definition.
ref: tla2sany/linter/Linter.java#lint
outcome: success
config: ""
---*)
---- MODULE sany_warning_default ----
a == 1
ASSUME [a |-> 2].a = 2
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | line 9, col 9 to line 9, col 9 of module sany_warning_default
    | The field name "a" in the record constructor is identical to the existing definition or declaration
    | named a, located at line 8, col 1 to line 8, col 6 of module sany_warning_default.
    | The field in the record will not take the value of the a definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [a |-> ...] = {"a"} holds true.
    2190:0 Finished computing initial states: 0 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
