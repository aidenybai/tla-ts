(*---
description: Evaluates a random function expression, seed 262, number 4046.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04046 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(Cardinality((1 .. 0)) :> Len((<<3, 1, 2>> \o <<3, 1, 2>>))) EXCEPT ![LET b6367 == ((2 % 2147483647) :> (1 * 3)) IN ((0 \div -1) - (TRUE % b6367))] = ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647] EXCEPT !.a = (\A b6368 \in Nat : TRUE)] @@ [(0 :> 7) EXCEPT ![LET b6369 == 7 IN b6369] = CASE TRUE -> 7 [] OTHER -> 0])])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 137 to line 14, col 140 of module random_04046 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 135.
    | Expression starting at line 14, column 135.
    | ExtendableExpr starting at line 14, column 134.
    | Expression starting at line 14, column 134.
    | ExtendableExpr starting at line 14, column 133.
    | Fatal errors while parsing TLA+ spec in file random_04046
    | In module random_04046
    | Could not parse module random_04046 from file random_04046.tla
    | *** Errors: 1
    | In module random_04046
    | Could not parse module random_04046 from file random_04046.tla
    3002:1 Parsing or semantic analysis failed.
---*)
