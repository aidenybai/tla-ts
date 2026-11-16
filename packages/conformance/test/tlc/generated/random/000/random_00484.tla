(*---
description: Evaluates a random record expression, seed 262, number 484.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00484 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE b797 \in {1} : <<3, 1, 2>>) .. LET b798 == <<5, 6>> IN b798) \cap (({2, 1, 3} \ 2..1) \cup ({1, 2} \cap {1}))) \cap (((0 * -1) .. (CHOOSE b799 \in {2, 1, 3} : TRUE)) \ ((2 .. 2) \cup ({x \in 1..3 : x > 1} \ SUBSET {1})))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 148 to line 14, col 148 of module random_00484 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 146.
    | Expression starting at line 14, column 146.
    | ExtendableExpr starting at line 14, column 145.
    | Expression starting at line 14, column 145.
    | ExtendableExpr starting at line 14, column 144.
    | Fatal errors while parsing TLA+ spec in file random_00484
    | In module random_00484
    | Could not parse module random_00484 from file random_00484.tla
    | *** Errors: 1
    | In module random_00484
    | Could not parse module random_00484 from file random_00484.tla
    3002:1 Parsing or semantic analysis failed.
---*)
