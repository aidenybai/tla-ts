(*---
description: Evaluates a random bool expression, seed 262, number 5562.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05562 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b8612 == CASE ({2, 1, 3} \subseteq {}) -> IF TRUE THEN 2147483647 ELSE 0 [] OTHER -> (-1 * -1) IN CASE [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b8612] -> (b8612 * 3) [] OTHER -> IF FALSE THEN 7 ELSE b8612 \in (LET b8613 == CASE (1 :> 2) -> 1 [] OTHER -> 7 IN (b8613 \div 7) .. ((3 \div -1) + (2 \div 3)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 110 to line 14, col 110 of module random_05562 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 108.
    | Expression starting at line 14, column 107.
    | ExtendableExpr starting at line 14, column 106.
    | Expression starting at line 14, column 106.
    | Case Other Arm starting at line 14, column 97.
    | Fatal errors while parsing TLA+ spec in file random_05562
    | In module random_05562
    | Could not parse module random_05562 from file random_05562.tla
    | *** Errors: 1
    | In module random_05562
    | Could not parse module random_05562 from file random_05562.tla
    3002:1 Parsing or semantic analysis failed.
---*)
