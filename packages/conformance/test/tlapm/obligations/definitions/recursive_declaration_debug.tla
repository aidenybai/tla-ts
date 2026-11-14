(*---
description: With --debug hidden, a RECURSIVE declaration prints as a hidden NEW CONSTANT with its shape.
ref: src/expr/e_fmt.ml#pp_print_defn
args: ["--debug", "hidden"]
mode: obligations
outcome: proved
---*)
---- MODULE recursive_declaration_debug ----
RECURSIVE F(_)
THEOREM TRUE
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
    @obl: ASSUME (* hidden *)
           NEW CONSTANT F(_)
    PROVE  TRUE

    @type: obligationsnumber
    @count: 1
---*)
