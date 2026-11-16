(*---
description: Evaluates a random set expression, seed 262, number 4251.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04251 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b6685 \in UNION {UNION {{x \in 1..3 : x > 1}, Nat}, {b6686 : b6686 \in {1, 2}}} : ((~TRUE) /\ (FALSE <=> TRUE))} \cap {Append((CHOOSE f \in [{1} -> {1}] : TRUE), (3 * -1)), ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 7]).a}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 183 to line 14, col 183 of module random_04251 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 181.
    | Expression starting at line 14, column 181.
    | ExtendableExpr starting at line 14, column 180.
    | Expression starting at line 14, column 180.
    | Optional Arguments starting at line 14, column 143.
    | Fatal errors while parsing TLA+ spec in file random_04251
    | In module random_04251
    | Could not parse module random_04251 from file random_04251.tla
    | *** Errors: 1
    | In module random_04251
    | Could not parse module random_04251 from file random_04251.tla
    3002:1 Parsing or semantic analysis failed.
---*)
