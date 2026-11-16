(*---
description: Evaluates a random function expression, seed 262, number 106.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00106 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b161 \in ({b162 : b162 \in Nat} \cup ({} \ {2, 1, 3})) |-> ((CHOOSE r \in [a : {}] : TRUE)).a] EXCEPT ![([b163 \in (1..3 \ {x \in 1..3 : x > 1}) |-> ((1 :> 2))[3]])[CASE (<<3, 1, 2>> = [x \in Nat |-> x + 1]) -> (-1 \div 1) [] OTHER -> Len(<<1>>)]] = CASE ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647] = [a |-> 1, b |-> TRUE]) -> IF (TRUE => TRUE) THEN (2 \in 1..3) ELSE (1 \div -1) [] OTHER -> CASE (TRUE /\ TRUE) -> CASE FALSE -> 2 [] OTHER -> 3 [] OTHER -> ([a |-> 1, b |-> TRUE]).a])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 398 to line 14, col 401 of module random_00106 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 396.
    | Expression starting at line 14, column 396.
    | ExtendableExpr starting at line 14, column 395.
    | Expression starting at line 14, column 395.
    | IF THEN ELSE starting at line 14, column 354.
    | Fatal errors while parsing TLA+ spec in file random_00106
    | In module random_00106
    | Could not parse module random_00106 from file random_00106.tla
    | *** Errors: 1
    | In module random_00106
    | Could not parse module random_00106 from file random_00106.tla
    3002:1 Parsing or semantic analysis failed.
---*)
