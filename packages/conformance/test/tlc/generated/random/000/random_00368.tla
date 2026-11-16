(*---
description: Evaluates a random set expression, seed 262, number 368.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00368 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(Head(<<3, 1, 2>>) - Head(<<>>)) : b606 \in UNION {(2..1 \cap {x \in 1..3 : x > 1}), {b607 : b607 \in 1..3}}} \ UNION {UNION {(2 .. 2..1), {0, -1}}, (UNION {1..3, <<1, 2>>} \ ({1} .. 7))}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops .. in block line 14, col 147 to line 14, col 148 of module random_00368 and ...
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 150.
    | ExtendableExpr starting at line 14, column 145.
    | Expression starting at line 14, column 145.
    | ExtendableExpr starting at line 14, column 144.
    | Expression starting at line 14, column 144.
    | Fatal errors while parsing TLA+ spec in file random_00368
    | In module random_00368
    | Could not parse module random_00368 from file random_00368.tla
    | *** Errors: 1
    | In module random_00368
    | Could not parse module random_00368 from file random_00368.tla
    3002:1 Parsing or semantic analysis failed.
---*)
