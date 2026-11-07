(*---
description: Evaluates a random seq expression, seed 262, number 5003.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05003 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq(Append(([x \in 1..2 |-> x] @@ [a |-> 1]), (CHOOSE b7782 \in {2, 1, 3} : FALSE)), ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2]).a, Len((<<1>> \o <<1>>))) \o Append(SubSeq(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), Head(FALSE), (2 * -1)), (CHOOSE b7783 \in UNION {1..3, {2, 1, 3}} : (b7783 .. 0)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 249 to line 14, col 249 of module random_05003 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 247.
    | Expression starting at line 14, column 247.
    | ExtendableExpr starting at line 14, column 246.
    | Expression starting at line 14, column 246.
    | Optional Arguments starting at line 14, column 192.
    | Fatal errors while parsing TLA+ spec in file random_05003
    | In module random_05003
    | Could not parse module random_05003 from file random_05003.tla
    | *** Errors: 1
    | In module random_05003
    | Could not parse module random_05003 from file random_05003.tla
    3002:1 Parsing or semantic analysis failed.
---*)
