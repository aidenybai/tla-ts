(*---
description: Evaluates a random record expression, seed 262, number 8322.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08322 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len(SelectSeq(<<>>, LAMBDA e : e > 0)) < LET b12875 == ({1} \ [a |-> 1, b |-> TRUE]) IN IF TRUE THEN 2147483647 ELSE b12875) => ({Cardinality({}), (3 * -1)} = DOMAIN [b12876 \in {1, 2} |-> b12876])))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 168 to line 14, col 168 of module random_08322 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 166.
    | Expression starting at line 14, column 166.
    | ExtendableExpr starting at line 14, column 165.
    | Expression starting at line 14, column 165.
    | Some { } form starting at line 14, column 147.
    | Fatal errors while parsing TLA+ spec in file random_08322
    | In module random_08322
    | Could not parse module random_08322 from file random_08322.tla
    | *** Errors: 1
    | In module random_08322
    | Could not parse module random_08322 from file random_08322.tla
    3002:1 Parsing or semantic analysis failed.
---*)
