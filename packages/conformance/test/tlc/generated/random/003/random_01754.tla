(*---
description: Evaluates a random int expression, seed 262, number 1754.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01754 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (\E b2786 \in UNION {DOMAIN [x \in 1..2 |-> x], UNION {{x \in 1..3 : x > 1}, 1..3}} : ({b2787 \in {1} : TRUE} \subseteq (1..3 \cup {1}))) -> CASE (\E b2788 \in {b2789 \in {1} : FALSE} : ([a |-> 1, b |-> TRUE] = [a |-> 1])) -> Tail(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)) [] OTHER -> LET b2790 == (3 * -1) IN (CHOOSE b2791 \in 1..3 : TRUE) [] OTHER -> Len(SelectSeq((<<1>> \o <<1, 2>>), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 323 to line 14, col 323 of module random_01754 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 321.
    | Expression starting at line 14, column 321.
    | ExtendableExpr starting at line 14, column 320.
    | Expression starting at line 14, column 320.
    | Definition starting at line 14, column 311.
    | Fatal errors while parsing TLA+ spec in file random_01754
    | In module random_01754
    | Could not parse module random_01754 from file random_01754.tla
    | *** Errors: 1
    | In module random_01754
    | Could not parse module random_01754 from file random_01754.tla
    3002:1 Parsing or semantic analysis failed.
---*)
