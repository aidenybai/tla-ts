(*---
description: -postCondition compares with equalsIgnoreCase.
ref: tlc2/TLC.java#handleParameters
outcome: assumption-violation
config: |
  INIT Init
  NEXT Next
args:
  - -POSTCONDITION
  - cli_post_fixture!Fail
includes:
  - cli_post_fixture.tla
---*)
---- MODULE flag_any_case ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2404:1 Postcondition Fail at line 4, col 9 to line 4, col 37 of module cli_post_fixture is false.
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
