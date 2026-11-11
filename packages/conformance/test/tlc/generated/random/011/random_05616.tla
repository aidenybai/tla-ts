(*---
description: Evaluates a random function expression, seed 262, number 5616.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05616 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b8689 \in (((TRUE \div 2147483647) .. (-1)) \cap {Tail(<<>>), (2147483647 * -1)}) |-> (-Len(SubSeq(<<3, 1, 2>>, 1, 1)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 91 to line 14, col 91 of module random_05616 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 80.
    | Expression starting at line 14, column 80.
    | ExtendableExpr starting at line 14, column 79.
    | Expression starting at line 14, column 79.
    | Some { } form starting at line 14, column 66.
    | Fatal errors while parsing TLA+ spec in file random_05616
    | In module random_05616
    | Could not parse module random_05616 from file random_05616.tla
    | *** Errors: 1
    | In module random_05616
    | Could not parse module random_05616 from file random_05616.tla
    3002:1 Parsing or semantic analysis failed.
---*)
