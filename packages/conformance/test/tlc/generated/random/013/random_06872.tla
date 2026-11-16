(*---
description: Evaluates a random seq expression, seed 262, number 6872.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06872 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([a |-> (Len(<<>>) % (3 * -1)), b |-> (UNION {{x \in 1..3 : x > 1}, {x \in 1..3 : x > 1}} \subseteq UNION {1..3, {}})], LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 49 to line 14, col 49 of module random_06872 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 47.
    | Expression starting at line 14, column 47.
    | ExtendableExpr starting at line 14, column 46.
    | ExtendableExpr starting at line 14, column 34.
    | Expression starting at line 14, column 34.
    | Fatal errors while parsing TLA+ spec in file random_06872
    | In module random_06872
    | Could not parse module random_06872 from file random_06872.tla
    | *** Errors: 1
    | In module random_06872
    | Could not parse module random_06872 from file random_06872.tla
    3002:1 Parsing or semantic analysis failed.
---*)
