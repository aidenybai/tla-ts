(*---
description: When no ENABLED rule matches the goal and its premises, ENABLEDaxioms fails with its own message.
ref: src/expr/e_action.ml#implication_to_enabled
mode: proof
outcome: failed
---*)
---- MODULE enabled_axioms_no_rule ----
EXTENDS TLAPS
VARIABLE x, y
THEOREM ASSUME NEW ACTION B, NEW ACTION C PROVE ENABLED B <=> ENABLED C
  BY ENABLEDaxioms
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: failed
    @prover: enabledaxioms
    @meth: time-limit: inf
    @reason: ENABLEDaxioms proof directive did not succeed.
    @already: false
    @obl: ENABLEDaxioms proof directive did not succeed.

    Obligation:

    ASSUME NEW VARIABLE x,
           NEW VARIABLE y,
           NEW ACTION B,
           NEW ACTION C,
           TRUE 
    PROVE  ENABLED B <=> ENABLED C

    @type: obligation
    @id: 2
    @loc: 11:6:11:19
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:19
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    expr has ENABLEDaxioms property ===
    File "./enabled_axioms_no_rule.tla", line 11, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE x,
                      NEW VARIABLE y,
                      NEW ACTION B,
                      NEW ACTION C,
                      ENABLEDaxioms 
               PROVE  ENABLED B <=> ENABLED C
    File "./enabled_axioms_no_rule.tla", line 7, character 1 to line 12, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"enabled_axioms_no_rule"`.
---*)
