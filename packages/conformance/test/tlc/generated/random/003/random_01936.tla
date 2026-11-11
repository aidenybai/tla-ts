(*---
description: Evaluates a random bool expression, seed 262, number 1936.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01936 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {({1, 2} \cup {2, 1, 3}), (1..3 \cap {2, 1, 3})} < ((1 + 0) + (0 * -1))) \/ (\E b3040 \in ((Nat \ {}) \cap {3 : b3041 \in {1, 2}}) : (LET b3042 == <<3, 1, 2>> IN -1 \in UNION {{}, Nat}))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 89 to line 14, col 89 of module random_01936 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 87.
    | Expression starting at line 14, column 87.
    | ExtendableExpr starting at line 14, column 86.
    | ExtendableExpr starting at line 14, column 76.
    | Expression starting at line 14, column 76.
    | Fatal errors while parsing TLA+ spec in file random_01936
    | In module random_01936
    | Could not parse module random_01936 from file random_01936.tla
    | *** Errors: 1
    | In module random_01936
    | Could not parse module random_01936 from file random_01936.tla
    3002:1 Parsing or semantic analysis failed.
---*)
