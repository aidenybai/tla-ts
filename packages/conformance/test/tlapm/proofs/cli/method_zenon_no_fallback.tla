(*---
description: With --method zenon there is no fallback to SMT, so an arithmetic fact fails.
ref: src/params.ml#parse_default_methods
mode: proof
args: ['--method', zenon]
outcome: failed
---*)
---- MODULE method_zenon_no_fallback ----
EXTENDS Naturals
THEOREM \A x \in Nat : x + 0 = x
  OBVIOUS
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:10
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 11:3:11:10
    @status: failed
    @prover: zenon
    @meth: time-limit: 10
    @reason: false
    @already: false
    @obl: 
    \A x \in Nat : x + 0 = x

    @type: obligationsnumber
    @count: 1

    Zenon error: exhausted search space without finding a proof
    File "./method_zenon_no_fallback.tla", line 11, characters 3-9:
    [ERROR]: Could not prove or check:
               \A x \in Nat : x + 0 = x
    File "./method_zenon_no_fallback.tla", line 8, character 1 to line 12, character 4:
    [ERROR]: 1/1 obligation failed.
    There were backend errors processing module `"method_zenon_no_fallback"`.
---*)
