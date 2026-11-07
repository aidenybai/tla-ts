(*---
description: When the goal does not follow from a hypothesis by a level-preserving renaming, LevelComparison fails with its own message.
ref: src/expr/e_level_comparison.ml#check_level_change
mode: proof
outcome: failed
---*)
---- MODULE level_comparison_fails ----
EXTENDS TLAPS
VARIABLE x, y
THEOREM ASSUME ASSUME NEW CONSTANT v PROVE [](v = 1) PROVE [](x = 1)
  BY LevelComparison
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
    @prover: levelcomparison
    @meth: time-limit: inf
    @reason: LevelComparison proof directive did not succeed.
    @already: false
    @obl: LevelComparison proof directive did not succeed.

    Obligation:

    ASSUME NEW VARIABLE x,
           NEW VARIABLE y,
           ASSUME NEW CONSTANT v
           PROVE  [](v = 1) ,
           TRUE 
    PROVE  [](x = 1)

    @type: obligation
    @id: 2
    @loc: 11:6:11:21
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./level_comparison_fails.tla", line 11, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE x,
                      NEW VARIABLE y,
                      ASSUME NEW CONSTANT v
                      PROVE  [](v = 1) ,
                      LevelComparison 
               PROVE  [](x = 1)
    File "./level_comparison_fails.tla", line 7, character 1 to line 12, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"level_comparison_fails"`.
---*)
