(*---
description: '--method fail uses a dummy method that never proves anything, so the obligation ends as an untreated failure.'
ref: src/params.ml#parse_default_methods
mode: proof
args: ['--method', fail]
outcome: failed
---*)
---- MODULE method_fail ----
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
    @prover: fail
    @meth: time-limit: inf
    @reason: unexpected error
    @already: false
    @obl: \A x \in Nat : x + 0 = x

    @type: obligationsnumber
    @count: 1

    File "./method_fail.tla", line 11, characters 3-9:
    [ERROR]: Could not prove or check:
               \A x \in Nat : x + 0 = x
    File "./method_fail.tla", line 8, character 1 to line 12, character 4:
    [ERROR]: 1/1 obligation failed.
    There were backend errors processing module `"method_fail"`.
---*)
