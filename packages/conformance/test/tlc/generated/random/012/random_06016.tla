(*---
description: Evaluates a random int expression, seed 262, number 6016.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06016 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(<<Head(FALSE), (<<>> * -1)>>) * (Append(SubSeq(<<1>>, 1, 2147483647), LET b9267 == 7 IN 7) - ((1 :> 3))[Cardinality([x \in Nat |-> x + 1])])))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 42 to line 14, col 42 of module random_06016 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 37.
    | Expression starting at line 14, column 37.
    | ExtendableExpr starting at line 14, column 36.
    | Expression starting at line 14, column 36.
    | Some << -- >> or >>_ Form starting at line 14, column 21.
    | Fatal errors while parsing TLA+ spec in file random_06016
    | In module random_06016
    | Could not parse module random_06016 from file random_06016.tla
    | *** Errors: 1
    | In module random_06016
    | Could not parse module random_06016 from file random_06016.tla
    3002:1 Parsing or semantic analysis failed.
---*)
