(*---
description: Evaluates a random int expression, seed 262, number 3329.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03329 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (\A b5290 \in ({3 : b5291 \in {2, 1, 3}} \ UNION {{1, 2}, {2, 1, 3}}) : ((SUBSET {1} \cup {1}) \subseteq (1..3 \ {}))) THEN CASE (([a |-> 1] = [a |-> 1]) => (SUBSET {1} \subseteq {1, 2})) -> IF (1 < -1) THEN ([a |-> 1, b |-> TRUE]).a ELSE (2 % 7) [] OTHER -> CASE (SUBSET {1} \subseteq 1..3) -> (1 + 2) [] OTHER -> (0 \div -1) ELSE ((([x \in 1..2 |-> x]).a \div LET b5292 == 3 IN b5292) + (CHOOSE b5293 \in (2 - 2) : (SUBSET {1} = 1..3))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 337 to line 14, col 340 of module random_03329 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 335.
    | Expression starting at line 14, column 335.
    | ExtendableExpr starting at line 14, column 334.
    | Expression starting at line 14, column 334.
    | Case Other Arm starting at line 14, column 325.
    | Fatal errors while parsing TLA+ spec in file random_03329
    | In module random_03329
    | Could not parse module random_03329 from file random_03329.tla
    | *** Errors: 1
    | In module random_03329
    | Could not parse module random_03329 from file random_03329.tla
    3002:1 Parsing or semantic analysis failed.
---*)
