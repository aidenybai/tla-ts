(*---
description: Obligations of successive theorems are numbered in module order.
ref: src/tlapm_lib.ml#add_id
mode: obligations
outcome: proved
---*)
---- MODULE two_theorems_ids ----
THEOREM 1 = 1
  OBVIOUS
THEOREM 2 = 2
  OBVIOUS
THEOREM 3 = 3
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 9:3:9:10
    @status: to be proved
    @obl: 1 = 1

    @type: obligation
    @id: 2
    @loc: 11:3:11:10
    @status: to be proved
    @obl: 2 = 2

    @type: obligation
    @id: 3
    @loc: 13:3:13:10
    @status: to be proved
    @obl: 3 = 3

    @type: obligationsnumber
    @count: 3
---*)
