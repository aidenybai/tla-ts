(*---
description: Evaluates a random function expression, seed 262, number 6106.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06106 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(7 :> 0) EXCEPT ![CASE TRUE -> 1 [] OTHER -> 2] = (CHOOSE b9398 \in SUBSET {1} : FALSE)] @@ ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3] @@ [[x \in Nat |-> x + 1] EXCEPT ![0] = 2147483647])) @@ [(([x \in 1..2 |-> x])[1] :> Append(<<>>, 1)) EXCEPT ![Len([<<1, 2>> EXCEPT ![1] = [x \in 1..2 |-> x]])] = (IF TRUE THEN 7 ELSE <<5, 6>> % (7 \div -1))]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 354 to line 14, col 357 of module random_06106 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 352.
    | Expression starting at line 14, column 352.
    | ExtendableExpr starting at line 14, column 351.
    | ExtendableExpr starting at line 14, column 340.
    | Expression starting at line 14, column 340.
    | Fatal errors while parsing TLA+ spec in file random_06106
    | In module random_06106
    | Could not parse module random_06106 from file random_06106.tla
    | *** Errors: 1
    | In module random_06106
    | Could not parse module random_06106 from file random_06106.tla
    3002:1 Parsing or semantic analysis failed.
---*)
