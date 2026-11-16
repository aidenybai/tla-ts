(*---
description: An AXIOM generates no obligation of its own, so a module with only axioms has zero obligations.
ref: src/module/m_gen.ml#generate
mode: obligations
outcome: proved
---*)
---- MODULE axiom_no_obligation ----
CONSTANT c
AXIOM c = 1
AXIOM B == c = 2
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
