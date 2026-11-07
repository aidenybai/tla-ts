(*---
description: DEF of a builtin operator such as Nat is ignored with a warning, and the proof goes on.
ref: src/proof/p_anon.ml#usable
mode: obligations
outcome: proved
---*)
---- MODULE by_def_builtin_ignored ----
EXTENDS Naturals
THEOREM 1 \in Nat
  BY DEF Nat
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: to be proved
    @obl: 1 \in Nat

    @type: obligationsnumber
    @count: 1

    File "./by_def_builtin_ignored.tla", line 10, characters 10-12 :
    Ignored unexpandable identifier "Nat" in BY DEF.
---*)
