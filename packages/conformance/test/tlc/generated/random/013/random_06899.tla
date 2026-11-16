(*---
description: Evaluates a random function expression, seed 262, number 6899.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06899 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((Len(<<1>>) * (-3)) :> ((CHOOSE f \in [{1} -> {0} \cup {1}] : TRUE))[(2147483647 * -1)]) EXCEPT ![(LET b10565 == (3 \div 7) IN Cardinality(1..3) % ((-1 + 7) - Len(<<3, 1, 2>>)))] = (CASE (\E b10566 \in {1} : FALSE) -> CASE 1 -> 2 [] OTHER -> 3 [] OTHER -> Len(<<1>>) + LET b10567 == ([a |-> 1, b |-> TRUE]).a IN Cardinality({2, 1, 3}))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 99 to line 14, col 99 of module random_06899 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 88.
    | Expression starting at line 14, column 88.
    | ExtendableExpr starting at line 14, column 87.
    | Expression starting at line 14, column 87.
    | Some [] Form starting at line 14, column 86.
    | Fatal errors while parsing TLA+ spec in file random_06899
    | In module random_06899
    | Could not parse module random_06899 from file random_06899.tla
    | *** Errors: 1
    | In module random_06899
    | Could not parse module random_06899 from file random_06899.tla
    3002:1 Parsing or semantic analysis failed.
---*)
