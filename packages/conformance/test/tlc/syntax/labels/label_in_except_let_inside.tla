(*---
description: A label in a LET inside an EXCEPT value is rejected too.
ref: "tla2sany/semantic/Generator.java#generateLabel"
features: [labels]
outcome: parse-error
---*)
---- MODULE label_in_except_let_inside ----
Op == [<<1>> EXCEPT ![1] = LET a == l:: 1 IN a]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 37 to line 8, col 41 of module label_in_except_let_inside
    | Labels inside EXCEPT clauses are not yet implemented.
    3002:1 Parsing or semantic analysis failed.
---*)
