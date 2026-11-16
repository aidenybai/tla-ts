(*---
description: "Without bullets, /\\ and \\/ on one line conflict, which bullets avoid."
ref: tla2sany/parser/Operators.java
features: [junctions]
outcome: parse-error
---*)
---- MODULE bare_infix_mix_conflict ----
Test == TRUE /\ FALSE \/ TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \land in block line 8, col 14 to line 8, col 15 of module bare_infix_mix_conflict and \lor.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 8, column 17.
    | ExtendableExpr starting at line 8, column 9.
    | Expression starting at line 8, column 9.
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file bare_infix_mix_conflict
    | In module bare_infix_mix_conflict
    | Could not parse module bare_infix_mix_conflict from file bare_infix_mix_conflict.tla
    | *** Errors: 1
    | In module bare_infix_mix_conflict
    | Could not parse module bare_infix_mix_conflict from file bare_infix_mix_conflict.tla
    3002:1 Parsing or semantic analysis failed.
---*)
