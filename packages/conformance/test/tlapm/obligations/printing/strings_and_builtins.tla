(*---
description: Strings, BOOLEAN, STRING, TRUE and FALSE print as written.
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE strings_and_builtins ----
THEOREM "abc" \in STRING /\ FALSE \in BOOLEAN /\ TRUE
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
    @obl: "abc" \in STRING /\ FALSE \in BOOLEAN /\ TRUE

    @type: obligationsnumber
    @count: 1
---*)
