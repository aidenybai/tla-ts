(*---
description: Evaluates a random int expression, seed 262, number 5572.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05572 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (((CHOOSE r \in [a : {1, 2}] : TRUE) = [a |-> [a |-> 1, b |-> TRUE], b |-> FALSE]) => ((SUBSET {1} \cup SUBSET {1}) = {b8623 \in {x \in 1..3 : x > 1} : TRUE})) THEN LET b8624 == Head({2, 3}) IN ([[a |-> 1] EXCEPT !.a = @ + SUBSET {1}]).a ELSE (IF (~TRUE) THEN CASE TRUE -> 3 [] OTHER -> 2 ELSE (1 \div -1) * ((<<5, 6>> @@ [x \in 1..2 |-> x]) @@ ([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x]))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 316 to line 14, col 319 of module random_05572 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 314.
    | Expression starting at line 14, column 314.
    | ExtendableExpr starting at line 14, column 313.
    | Expression starting at line 14, column 313.
    | IF THEN ELSE starting at line 14, column 263.
    | Fatal errors while parsing TLA+ spec in file random_05572
    | In module random_05572
    | Could not parse module random_05572 from file random_05572.tla
    | *** Errors: 1
    | In module random_05572
    | Could not parse module random_05572 from file random_05572.tla
    3002:1 Parsing or semantic analysis failed.
---*)
