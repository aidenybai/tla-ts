(*---
description: Evaluates a random seq expression, seed 262, number 8586.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08586 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SelectSeq(Append(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), (2 * 2147483647)), LAMBDA e : e > 0), ((Cardinality([a |-> 1, b |-> TRUE]) \div (2147483647 * -1)) - (([x \in Nat |-> x + 1] @@ <<5, 6>>))[(2147483647 - 1)])))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 172 to line 14, col 172 of module random_08586 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 161.
    | Expression starting at line 14, column 161.
    | ExtendableExpr starting at line 14, column 160.
    | ExtendableExpr starting at line 14, column 120.
    | Expression starting at line 14, column 120.
    | Fatal errors while parsing TLA+ spec in file random_08586
    | In module random_08586
    | Could not parse module random_08586 from file random_08586.tla
    | *** Errors: 1
    | In module random_08586
    | Could not parse module random_08586 from file random_08586.tla
    3002:1 Parsing or semantic analysis failed.
---*)
