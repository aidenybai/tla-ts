(*---
description: ENABLED over a declared action cannot be expanded soundly, so ExpandENABLED fails with a message naming the operator's level and arity.
ref: src/expr/e_action.ml#expand_action_operators
mode: proof
outcome: failed
---*)
---- MODULE expand_enabled_declared_action ----
EXTENDS TLAPS
VARIABLE x, y
THEOREM ASSUME NEW ACTION B PROVE (ENABLED B) => (ENABLED B)
  BY ExpandENABLED
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
    @prover: expandenabled
    @meth: time-limit: inf
    @reason: The expression that results from applying the declared operator `B` has expression level 2 within the scope of `ENABLED` or `\cdot` where soundness requires expanding expressions of level >= 2. A declared operator cannot be expanded.
    The operator `B` is declared at:
    File "./expand_enabled_declared_action.tla", line 10, characters 20-27
     and has level: 2
     and arity: 0
    @already: false
    @obl: The expression that results from applying the declared operator `B` has expression level 2 within the scope of `ENABLED` or `\cdot` where soundness requires expanding expressions of level >= 2. A declared operator cannot be expanded.
    The operator `B` is declared at:
    File "./expand_enabled_declared_action.tla", line 10, characters 20-27
     and has level: 2
     and arity: 0
    Obligation:

    ASSUME NEW VARIABLE x,
           NEW VARIABLE y,
           NEW ACTION B,
           TRUE 
    PROVE  ENABLED B => ENABLED B

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

    File "./expand_enabled_declared_action.tla", line 10, character 44:
    Error: The expression that results from applying the declared operator `B` has expression level 2 within the scope of `ENABLED` or `\cdot` where soundness requires expanding expressions of level >= 2. A declared operator cannot be expanded.
    The operator `B` is declared at:
    File "./expand_enabled_declared_action.tla", line 10, characters 20-27
     and has level: 2
     and arity: 0
    File "./expand_enabled_declared_action.tla", line 11, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE x,
                      NEW VARIABLE y,
                      NEW ACTION B,
                      ExpandENABLED 
               PROVE  ENABLED B => ENABLED B
    File "./expand_enabled_declared_action.tla", line 7, character 1 to line 12, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"expand_enabled_declared_action"`.
---*)
