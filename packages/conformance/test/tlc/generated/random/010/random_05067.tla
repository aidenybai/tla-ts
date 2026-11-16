(*---
description: Evaluates a random bool expression, seed 262, number 5067.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05067 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SubSeq(Append(<<3, 1, 2>>, 0), (<<5, 6>> + -1), (3 * -1)) \o [Tail(<<1, 2>>) EXCEPT ![1] = Len(<<1, 2>>)]) = {((CHOOSE r \in [a : 1..2] : TRUE)).a : b7887 \in (Head(<<>>) .. CASE FALSE -> <<1>> [] OTHER -> 0)}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 69 to line 14, col 69 of module random_05067 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 67.
    | Expression starting at line 14, column 67.
    | ExtendableExpr starting at line 14, column 66.
    | Expression starting at line 14, column 66.
    | Optional Arguments starting at line 14, column 24.
    | Fatal errors while parsing TLA+ spec in file random_05067
    | In module random_05067
    | Could not parse module random_05067 from file random_05067.tla
    | *** Errors: 1
    | In module random_05067
    | Could not parse module random_05067 from file random_05067.tla
    3002:1 Parsing or semantic analysis failed.
---*)
