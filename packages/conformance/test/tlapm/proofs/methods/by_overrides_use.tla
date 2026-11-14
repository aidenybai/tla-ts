(*---
description: A pragma in BY replaces one from an earlier USE, so only Zenon runs and the arithmetic fact fails.
ref: src/backend/prep.ml#find_meth
mode: proof
outcome: failed
---*)
---- MODULE by_overrides_use ----
EXTENDS Naturals, TLAPS
USE SMT
THEOREM \A x \in Nat : x + 0 = x
  BY Zenon
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 9:1:9:4
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 9:1:9:4
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 2
    @loc: 11:3:11:5
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:3:11:5
    @status: failed
    @prover: zenon
    @meth: time-limit: 10
    @reason: false
    @already: false
    @obl: 
    ASSUME TRUE ,
           TRUE 
    PROVE  \A x \in Nat : x + 0 = x

    @type: obligation
    @id: 3
    @loc: 11:6:11:11
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 11:6:11:11
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 3

    Zenon error: exhausted search space without finding a proof
    File "./by_overrides_use.tla", line 11, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME SMT ,
                      Zenon 
               PROVE  \A x \in Nat : x + 0 = x
    File "./by_overrides_use.tla", line 7, character 1 to line 12, character 4:
    [ERROR]: 1/3 obligations failed.
    There were backend errors processing module `"by_overrides_use"`.
---*)
