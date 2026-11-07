(*---
description: '--method takes a comma-separated list and tries it in order, so Zenon fails and SMT proves.'
ref: src/params.ml#parse_default_methods
mode: proof
args: ['--method', 'zenon,smt']
outcome: proved
---*)
---- MODULE method_list_order ----
EXTENDS Naturals
THEOREM \A x \in Nat : x + 0 = x
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:10
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 11:3:11:10
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 1

    Zenon error: exhausted search space without finding a proof
    File "./method_list_order.tla", line 8, character 1 to line 12, character 4:
    [INFO]: All 1 obligation proved.
---*)
