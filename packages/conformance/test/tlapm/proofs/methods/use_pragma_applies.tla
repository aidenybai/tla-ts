(*---
description: A pragma made usable with USE applies to a later OBVIOUS step, so only Zenon runs and the arithmetic fact fails without falling back to SMT.
ref: src/backend/prep.ml#find_meth
mode: proof
outcome: failed
---*)
---- MODULE use_pragma_applies ----
EXTENDS Naturals, TLAPS
USE Zenon
THEOREM \A x \in Nat : x + 0 = x
  OBVIOUS
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
    @loc: 11:3:11:10
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:3:11:10
    @status: failed
    @prover: zenon
    @meth: time-limit: 10
    @reason: false
    @already: false
    @obl: 
    ASSUME TRUE 
    PROVE  \A x \in Nat : x + 0 = x

    @type: obligationsnumber
    @count: 2

    Zenon error: exhausted search space without finding a proof
    File "./use_pragma_applies.tla", line 11, characters 3-9:
    [ERROR]: Could not prove or check:
               ASSUME Zenon 
               PROVE  \A x \in Nat : x + 0 = x
    File "./use_pragma_applies.tla", line 7, character 1 to line 12, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"use_pragma_applies"`.
---*)
