(*---
description: Evaluates a random set expression, seed 262, number 8146.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08146 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b12594 \in ((1..3 .. -1) \cap {0 : b12595 \in {1}}) : (DOMAIN (1 :> 2) = ({} \cap 2..1))) .. ([[[x \in 1..2 |-> x] EXCEPT ![1] = 0] EXCEPT ![(-1)] = (CHOOSE b12596 \in SUBSET {1} : FALSE)])[Len(SubSeq(<<3, 1, 2>>, 7, [x \in 1..2 |-> x]))]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops .. in block line 14, col 39 to line 14, col 40 of module random_08146 and ...
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 41.
    | ExtendableExpr starting at line 14, column 38.
    | Expression starting at line 14, column 38.
    | ExtendableExpr starting at line 14, column 37.
    | Expression starting at line 14, column 37.
    | Fatal errors while parsing TLA+ spec in file random_08146
    | In module random_08146
    | Could not parse module random_08146 from file random_08146.tla
    | *** Errors: 1
    | In module random_08146
    | Could not parse module random_08146 from file random_08146.tla
    3002:1 Parsing or semantic analysis failed.
---*)
