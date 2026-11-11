(*---
description: Evaluates a random seq expression, seed 262, number 8449.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08449 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(<<((3 * -1) % Len(<<1, 2>>)), CASE (\A b13077 \in 1..3 : TRUE) -> ([a |-> 1, b |-> TRUE]).a [] OTHER -> Tail(<<1>>)>>, LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 30 to line 14, col 30 of module random_08449 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 28.
    | Expression starting at line 14, column 28.
    | ExtendableExpr starting at line 14, column 27.
    | Expression starting at line 14, column 27.
    | ExtendableExpr starting at line 14, column 26.
    | Fatal errors while parsing TLA+ spec in file random_08449
    | In module random_08449
    | Could not parse module random_08449 from file random_08449.tla
    | *** Errors: 1
    | In module random_08449
    | Could not parse module random_08449 from file random_08449.tla
    3002:1 Parsing or semantic analysis failed.
---*)
