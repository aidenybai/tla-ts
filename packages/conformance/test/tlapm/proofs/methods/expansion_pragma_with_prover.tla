(*---
description: An expansion pragma next to a prover pragma does not add the default methods, so only Zenon runs and fails on arithmetic.
ref: src/backend/prep.ml#find_meth
mode: proof
outcome: failed
---*)
---- MODULE expansion_pragma_with_prover ----
EXTENDS Naturals, TLAPS
THEOREM \A x \in Nat : x + 0 = x
  BY ExpandENABLED, Zenon
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 10:3:10:5
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
    @id: 2
    @loc: 10:6:10:19
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:19
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 10:21:10:26
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 10:21:10:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 3

    Zenon error: exhausted search space without finding a proof
    File "./expansion_pragma_with_prover.tla", line 10, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME ExpandENABLED ,
                      Zenon 
               PROVE  \A x \in Nat : x + 0 = x
    File "./expansion_pragma_with_prover.tla", line 7, character 1 to line 11, character 4:
    [ERROR]: 1/3 obligations failed.
    There were backend errors processing module `"expansion_pragma_with_prover"`.
---*)
