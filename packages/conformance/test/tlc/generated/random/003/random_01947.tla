(*---
description: Evaluates a random seq expression, seed 262, number 1947.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01947 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((SelectSeq(SelectSeq(<<1>>, LAMBDA e : e > 0), LAMBDA e : e > 0) \o Tail(Append(<<3, 1, 2>>, -1))), ((-(0 * -1)) \div Cardinality(({2, 1, 3} \cup {1, 2}))), ((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 129 to line 14, col 129 of module random_01947 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 127.
    | Expression starting at line 14, column 127.
    | ExtendableExpr starting at line 14, column 126.
    | Expression starting at line 14, column 125.
    | ExtendableExpr starting at line 14, column 124.
    | Fatal errors while parsing TLA+ spec in file random_01947
    | In module random_01947
    | Could not parse module random_01947 from file random_01947.tla
    | *** Errors: 1
    | In module random_01947
    | Could not parse module random_01947 from file random_01947.tla
    3002:1 Parsing or semantic analysis failed.
---*)
