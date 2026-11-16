(*---
description: Ported from TLC's AliasLivenessStutteringTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/AliasLivenessStutteringTest.java
features:
  - tlc-regression
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  ALIAS Alias
  POSTCONDITION PostConditionStuttering
  PROPERTY Tautology
args:
  - -deadlock
---*)







---- MODULE Alias ----
EXTENDS Integers, TLC, Sequences, TLCExt

VARIABLES x, y
vars == <<x,y>>

A ==
/\ y' = ~y
/\ x < 4
/\ x' = x + 1

B ==
/\ y' = ~y
/\ x = 4
/\ x' = 1             

Next == A \/ B

Spec == x = 1 /\ y = FALSE /\ [][Next]_vars

FairSpec == Spec /\ WF_vars(Next)

Inv == x < 4

Prop == <>(x > 4)

Animation(e1,e2) == "e1: " \o ToString(e1) \o " e2: " \o ToString(e2)

\* An expression that is evaluated on the pair of states
\* s and t and printed in place of s in an error trace.
\* Useful to:
\* - filter out variables (not shown below)
\* - rename variables
\* - map variables (e.g. animation)
\* - additional trace expressions
\* TLC ignores the original state if the evaluation of
\* Alias fails.
Alias == IF TLCGet("config").mode = "simulate" THEN
         [y |-> y, \* x and y reordered.
          x |-> x, 
          a |-> x' - x, 
          b |-> x' = x,
          anim |-> Animation(x, y), \* Animation
          te |-> ENABLED Next,      \* Trace Expression
          TLCGetAction |-> TLCGet("action"),
          lvl |-> [ i \in {1,2} |-> TLCGet("level")]]
         ELSE IF TLCGet("spec").impliedtemporals # {} THEN
         [yy |-> y, \* x and y reordered.
          x |-> x, 
          a |-> x' - x, 
          b |-> x' = x,
          anim |-> Animation(x, y), \* Animation
          te |-> ENABLED Next,      \* Trace Expression
          lvl |-> [ i \in {1,2} |-> TLCGet("level")],
          trc |-> Trace]
         ELSE
         [yy |-> y, \* x and y reordered.
          x |-> x, 
          a |-> x' - x, 
          b |-> x' = x,
          anim |-> Animation(x, y), \* Animation
          te |-> ENABLED Next,      \* Trace Expression
          lvl |-> [ i \in {1,2} |-> TLCGet("level")]]

\* Omits x, which Prop refers to.
YAlias == [y |-> y]

\* Violated by the step from x = 3 to x = 4. TLC finds the violation in the
\* behavior graph, like a safety property.
SafetyProp == [](x >= 3 => [](x < 4))

PostCondition ==
	/\ TLCGet("config").mode = "bfs" => TLCSet(42, TLCGet("generated"))
  	/\ CounterExample = 
  	   IF TLCGet("config").mode = "simulate" THEN
  	   	[ action |->
	      { << << 1,
	              [ x |-> 1,
	                y |-> FALSE,
	                a |-> 1,
	                b |-> FALSE,
	                anim |-> "e1: 1 e2: FALSE",
	                te |-> TRUE,
	                TLCGetAction |->
	                    [ name |-> "UnnamedAction",
	                      location |->
	                          [ beginLine |-> 26,
	                            beginColumn |-> 18,
	                            endLine |-> 26,
	                            endColumn |-> 26,
	                            module |-> "Alias" ] ],
	                lvl |-> <<1, 1>> ] >>,
	           [ name |-> "A",
	             location |->
	                 [ beginLine |-> 15,
	                   beginColumn |-> 1,
	                   endLine |-> 17,
	                   endColumn |-> 13,
	                   module |-> "Alias" ] ],
	           << 2,
	              [ x |-> 2,
	                y |-> TRUE,
	                a |-> 1,
	                b |-> FALSE,
	                anim |-> "e1: 2 e2: TRUE",
	                te |-> TRUE,
	                TLCGetAction |->
	                    [ name |-> "A",
	                      location |->
	                          [ beginLine |-> 15,
	                            beginColumn |-> 1,
	                            endLine |-> 17,
	                            endColumn |-> 13,
	                            module |-> "Alias" ] ],
	                lvl |-> <<2, 2>> ] >> >>,
	        << << 2,
	              [ x |-> 2,
	                y |-> TRUE,
	                a |-> 1,
	                b |-> FALSE,
	                anim |-> "e1: 2 e2: TRUE",
	                te |-> TRUE,
	                TLCGetAction |->
	                    [ name |-> "A",
	                      location |->
	                          [ beginLine |-> 15,
	                            beginColumn |-> 1,
	                            endLine |-> 17,
	                            endColumn |-> 13,
	                            module |-> "Alias" ] ],
	                lvl |-> <<2, 2>> ] >>,
	           [ name |-> "A",
	             location |->
	                 [ beginLine |-> 15,
	                   beginColumn |-> 1,
	                   endLine |-> 17,
	                   endColumn |-> 13,
	                   module |-> "Alias" ] ],
	           << 3,
	              [ x |-> 3,
	                y |-> FALSE,
	                a |-> 1,
	                b |-> FALSE,
	                anim |-> "e1: 3 e2: FALSE",
	                te |-> TRUE,
	                TLCGetAction |->
	                    [ name |-> "A",
	                      location |->
	                          [ beginLine |-> 15,
	                            beginColumn |-> 1,
	                            endLine |-> 17,
	                            endColumn |-> 13,
	                            module |-> "Alias" ] ],
	                lvl |-> <<3, 3>> ] >> >>,
	        << << 3,
	              [ x |-> 3,
	                y |-> FALSE,
	                a |-> 1,
	                b |-> FALSE,
	                anim |-> "e1: 3 e2: FALSE",
	                te |-> TRUE,
	                TLCGetAction |->
	                    [ name |-> "A",
	                      location |->
	                          [ beginLine |-> 15,
	                            beginColumn |-> 1,
	                            endLine |-> 17,
	                            endColumn |-> 13,
	                            module |-> "Alias" ] ],
	                lvl |-> <<3, 3>> ] >>,
	           [ name |-> "A",
	             location |->
	                 [ beginLine |-> 15,
	                   beginColumn |-> 1,
	                   endLine |-> 17,
	                   endColumn |-> 13,
	                   module |-> "Alias" ] ],
	           << 4,
	              [ x |-> 4,
	                y |-> TRUE,
	                a |-> 0,
	                b |-> TRUE,
	                anim |-> "e1: 4 e2: TRUE",
	                te |-> TRUE,
	                TLCGetAction |->
	                    [ name |-> "A",
	                      location |->
	                          [ beginLine |-> 15,
	                            beginColumn |-> 1,
	                            endLine |-> 17,
	                            endColumn |-> 13,
	                            module |-> "Alias" ] ],
	                lvl |-> <<4, 4>> ] >> >> },
		  state |->
		      { << 1,
		           [ x |-> 1,
		             y |-> FALSE,
		             a |-> 1,
		             b |-> FALSE,
		             anim |-> "e1: 1 e2: FALSE",
		             te |-> TRUE,
		             TLCGetAction |->
		                 [ name |-> "UnnamedAction",
		                   location |->
		                       [ beginLine |-> 26,
		                         beginColumn |-> 18,
		                         endLine |-> 26,
		                         endColumn |-> 26,
		                         module |-> "Alias" ] ],
		             lvl |-> <<1, 1>> ] >>,
		        << 2,
		           [ x |-> 2,
		             y |-> TRUE,
		             a |-> 1,
		             b |-> FALSE,
		             anim |-> "e1: 2 e2: TRUE",
		             te |-> TRUE,
		             TLCGetAction |->
		                 [ name |-> "A",
		                   location |->
		                       [ beginLine |-> 15,
		                         beginColumn |-> 1,
		                         endLine |-> 17,
		                         endColumn |-> 13,
		                         module |-> "Alias" ] ],
		             lvl |-> <<2, 2>> ] >>,
		        << 3,
		           [ x |-> 3,
		             y |-> FALSE,
		             a |-> 1,
		             b |-> FALSE,
		             anim |-> "e1: 3 e2: FALSE",
		             te |-> TRUE,
		             TLCGetAction |->
		                 [ name |-> "A",
		                   location |->
		                       [ beginLine |-> 15,
		                         beginColumn |-> 1,
		                         endLine |-> 17,
		                         endColumn |-> 13,
		                         module |-> "Alias" ] ],
		             lvl |-> <<3, 3>> ] >>,
		        << 4,
		           [ x |-> 4,
		             y |-> TRUE,
		             a |-> 0,
		             b |-> TRUE,
		             anim |-> "e1: 4 e2: TRUE",
		             te |-> TRUE,
		             TLCGetAction |->
		                 [ name |-> "A",
		                   location |->
		                       [ beginLine |-> 15,
		                         beginColumn |-> 1,
		                         endLine |-> 17,
		                         endColumn |-> 13,
		                         module |-> "Alias" ] ],
		             lvl |-> <<4, 4>> ] >> } ]
  	   ELSE
		[ action |->
            { << << 1,
                    [ x |-> 1,
                      a |-> 1,
                      b |-> FALSE,
                      anim |-> "e1: 1 e2: FALSE",
                      te |-> TRUE,
                      lvl |-> <<1, 1>>,
		                yy |-> FALSE ] >>,
                [ name |-> "A",
                  location |->
                      [ beginLine |-> 15,
                        beginColumn |-> 1,
                        endLine |-> 17,
                        endColumn |-> 13,
                        module |-> "Alias" ] ],
                << 2,
                    [ x |-> 2,
                      a |-> 1,
                      b |-> FALSE,
                      anim |-> "e1: 2 e2: TRUE",
                      te |-> TRUE,
                      lvl |-> <<2, 2>>,
		                yy |-> TRUE ] >> >>,
              << << 2,
                    [ x |-> 2,
                      a |-> 1,
                      b |-> FALSE,
                      anim |-> "e1: 2 e2: TRUE",
                      te |-> TRUE,
                      lvl |-> <<2, 2>>,
		                yy |-> TRUE ] >>,
                [ name |-> "A",
                  location |->
                      [ beginLine |-> 15,
                        beginColumn |-> 1,
                        endLine |-> 17,
                        endColumn |-> 13,
                        module |-> "Alias" ] ],
                << 3,
                    [ x |-> 3,
                      a |-> 1,
                      b |-> FALSE,
                      anim |-> "e1: 3 e2: FALSE",
                      te |-> TRUE,
                      lvl |-> <<3, 3>>,
		                yy |-> FALSE ] >> >>,
              << << 3,
                    [ x |-> 3,
                      a |-> 1,
                      b |-> FALSE,
                      anim |-> "e1: 3 e2: FALSE",
                      te |-> TRUE,
                      lvl |-> <<3, 3>>,
		                yy |-> FALSE ] >>,
                [ name |-> "A",
                  location |->
                      [ beginLine |-> 15,
                        beginColumn |-> 1,
                        endLine |-> 17,
                        endColumn |-> 13,
                        module |-> "Alias" ] ],
		           << 4,
		              [ x |-> 4,
		                a |-> 0,
		                b |-> TRUE,
		                anim |-> "e1: 4 e2: TRUE",
		                te |-> TRUE,
		                lvl |-> <<4, 4>>,
		                yy |-> TRUE ] >> >> },
	        state |->
	            { << 1,
	                [ x |-> 1,
	                  a |-> 1,
	                  b |-> FALSE,
	                  anim |-> "e1: 1 e2: FALSE",
	                  te |-> TRUE,
	                  lvl |-> <<1, 1>>,
		             yy |-> FALSE ] >>,
	              << 2,
	                [ x |-> 2,
	                  a |-> 1,
	                  b |-> FALSE,
	                  anim |-> "e1: 2 e2: TRUE",
	                  te |-> TRUE,
	                  lvl |-> <<2, 2>>,
		             yy |-> TRUE ] >>,
	              << 3,
	                [ x |-> 3,
	                  a |-> 1,
	                  b |-> FALSE,
	                  anim |-> "e1: 3 e2: FALSE",
	                  te |-> TRUE,
	                  lvl |-> <<3, 3>>,
		             yy |-> FALSE ] >>,
		        << 4,
		           [ x |-> 4,
		             a |-> 0,
		             b |-> TRUE,
		             anim |-> "e1: 4 e2: TRUE",
		             te |-> TRUE,
		             lvl |-> <<4, 4>>,
		             yy |-> TRUE ] >> } ]
	
PostConditionLasso ==
  	/\ IF CounterExample.state = {} THEN TRUE ELSE CounterExample = 
			[ action |->
			      { << <<1, [x |-> 1, y |-> FALSE]>>,
			           [ name |-> "A",
			             location |->
			                 [ beginLine |-> 15,
			                   beginColumn |-> 1,
			                   endLine |-> 17,
			                   endColumn |-> 13,
			                   module |-> "Alias" ] ],
			           <<2, [x |-> 2, y |-> TRUE]>> >>,
			        << <<2, [x |-> 2, y |-> TRUE]>>,
			           [ name |-> "A",
			             location |->
			                 [ beginLine |-> 15,
			                   beginColumn |-> 1,
			                   endLine |-> 17,
			                   endColumn |-> 13,
			                   module |-> "Alias" ] ],
			           <<3, [x |-> 3, y |-> FALSE]>> >>,
			        << <<3, [x |-> 3, y |-> FALSE]>>,
			           [ name |-> "A",
			             location |->
			                 [ beginLine |-> 15,
			                   beginColumn |-> 1,
			                   endLine |-> 17,
			                   endColumn |-> 13,
			                   module |-> "Alias" ] ],
			           <<4, [x |-> 4, y |-> TRUE]>> >>,
			        << <<4, [x |-> 4, y |-> TRUE]>>,
			           [ name |-> "B",
			             location |->
			                 [ beginLine |-> 20,
			                   beginColumn |-> 1,
			                   endLine |-> 22,
			                   endColumn |-> 9,
			                   module |-> "Alias" ] ],
			           <<1, [x |-> 1, y |-> FALSE]>> >> },
			  state |->
			      { <<1, [x |-> 1, y |-> FALSE]>>,
			        <<2, [x |-> 2, y |-> TRUE]>>,
			        <<3, [x |-> 3, y |-> FALSE]>>,
			        <<4, [x |-> 4, y |-> TRUE]>> } ]

Tautology == (vars = vars) ~> (vars = vars)

PostConditionStuttering ==
  	/\ IF CounterExample.state = {} THEN TRUE ELSE CounterExample = 
			[ action |->
			      { << <<1, [x |-> 1, y |-> FALSE]>>,
			           [ name |-> "UnnamedAction",
			             location |->
			                 [ beginLine |-> 26,
			                   beginColumn |-> 18,
			                   endLine |-> 26,
			                   endColumn |-> 26,
			                   module |-> "Alias" ] ],
			           <<1, [x |-> 1, y |-> FALSE]>> >> },
			  state |->
			      { <<1, [x |-> 1, y |-> FALSE]>> } ]

=======================

---- CONFIG Alias ----
SPECIFICATION FairSpec
INVARIANT Inv
ALIAS Alias
POSTCONDITION PostCondition
======================


\* FairSpec => []Inv
Error: Invariant Inv is violated.
Error: The behavior up to this point is:
State 1: <Initial predicate>
/\ y = FALSE
/\ x = 1
/\ a = 1
/\ b = FALSE

State 2: <Action line 11, col 34 to line 11, col 46 of module Alias>
/\ y = TRUE
/\ x = 2
/\ a = 1
/\ b = FALSE

State 3: <Action line 11, col 34 to line 11, col 46 of module Alias>
/\ y = FALSE
/\ x = 3
/\ a = 1
/\ b = FALSE

State 4: <Action line 11, col 34 to line 11, col 46 of module Alias>
/\ y = TRUE
/\ x = 4
/\ a = 0     \* Stuttering
/\ b = TRUE  \* Stuttering

-------------------------------
\* Spec => Prop
Error: Temporal properties were violated.
Error: The following behavior constitutes a counter-example:

State 1: <Initial predicate>
/\ y = FALSE
/\ x = 1
/\ a = 0     \* Stuttering
/\ b = TRUE  \* Stuttering

State 2: Stuttering

-------------------------------
\* FairSpec => Prop
Error: Temporal properties were violated.
Error: The following behavior constitutes a counter-example:

State 1: <Initial predicate>
/\ y = FALSE
/\ x = 1
/\ a = 1
/\ b = FALSE

State 2: <Next line 17, col 9 to line 21, col 23 of module Alias>
/\ y = TRUE
/\ x = 2
/\ a = 1
/\ b = FALSE

State 3: <Next line 17, col 9 to line 21, col 23 of module Alias>
/\ y = FALSE
/\ x = 3
/\ a = 1
/\ b = FALSE

State 4: <Next line 17, col 9 to line 21, col 23 of module Alias>
/\ y = TRUE
/\ x = 4
/\ a = -3      \* State 1 is successor
/\ b = FALSE   \* State 1 is successor

Back to state 1: <Next line 17, col 9 to line 21, col 23 of module Alias>

-------------------------------

(*--- recorded
all:
  exit: 13
  transcript: |-
    | line 389, col 42 to line 389, col 42 of module Alias
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 26, col 11 to line 26, col 11 of module Alias.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 389, col 51 to line 389, col 51 of module Alias
    | The field name "y" in the record constructor is identical to the existing definition or declaration
    | named y, located at line 26, col 14 to line 26, col 14 of module Alias.
    | The field in the record will not take the value of the y definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [y |-> ...] = {"y"} holds true.
    | line 397, col 42 to line 397, col 42 of module Alias
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 26, col 11 to line 26, col 11 of module Alias.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 397, col 51 to line 397, col 51 of module Alias
    | The field name "y" in the record constructor is identical to the existing definition or declaration
    | named y, located at line 26, col 14 to line 26, col 14 of module Alias.
    | The field in the record will not take the value of the y definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [y |-> ...] = {"y"} holds true.
    | line 398, col 42 to line 398, col 42 of module Alias
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 26, col 11 to line 26, col 11 of module Alias.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 398, col 51 to line 398, col 51 of module Alias
    | The field name "y" in the record constructor is identical to the existing definition or declaration
    | named y, located at line 26, col 14 to line 26, col 14 of module Alias.
    | The field in the record will not take the value of the y definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [y |-> ...] = {"y"} holds true.
    | line 406, col 42 to line 406, col 42 of module Alias
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 26, col 11 to line 26, col 11 of module Alias.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 406, col 51 to line 406, col 51 of module Alias
    | The field name "y" in the record constructor is identical to the existing definition or declaration
    | named y, located at line 26, col 14 to line 26, col 14 of module Alias.
    | The field in the record will not take the value of the y definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [y |-> ...] = {"y"} holds true.
    | line 407, col 42 to line 407, col 42 of module Alias
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 26, col 11 to line 26, col 11 of module Alias.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 407, col 51 to line 407, col 51 of module Alias
    | The field name "y" in the record constructor is identical to the existing definition or declaration
    | named y, located at line 26, col 14 to line 26, col 14 of module Alias.
    | The field in the record will not take the value of the y definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [y |-> ...] = {"y"} holds true.
    | line 415, col 42 to line 415, col 42 of module Alias
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 26, col 11 to line 26, col 11 of module Alias.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 415, col 51 to line 415, col 51 of module Alias
    | The field name "y" in the record constructor is identical to the existing definition or declaration
    | named y, located at line 26, col 14 to line 26, col 14 of module Alias.
    | The field in the record will not take the value of the y definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [y |-> ...] = {"y"} holds true.
    | line 416, col 42 to line 416, col 42 of module Alias
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 26, col 11 to line 26, col 11 of module Alias.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 416, col 51 to line 416, col 51 of module Alias
    | The field name "y" in the record constructor is identical to the existing definition or declaration
    | named y, located at line 26, col 14 to line 26, col 14 of module Alias.
    | The field in the record will not take the value of the y definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [y |-> ...] = {"y"} holds true.
    | line 424, col 42 to line 424, col 42 of module Alias
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 26, col 11 to line 26, col 11 of module Alias.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 424, col 51 to line 424, col 51 of module Alias
    | The field name "y" in the record constructor is identical to the existing definition or declaration
    | named y, located at line 26, col 14 to line 26, col 14 of module Alias.
    | The field in the record will not take the value of the y definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [y |-> ...] = {"y"} holds true.
    | line 426, col 39 to line 426, col 39 of module Alias
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 26, col 11 to line 26, col 11 of module Alias.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 426, col 48 to line 426, col 48 of module Alias
    | The field name "y" in the record constructor is identical to the existing definition or declaration
    | named y, located at line 26, col 14 to line 26, col 14 of module Alias.
    | The field in the record will not take the value of the y definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [y |-> ...] = {"y"} holds true.
    | line 427, col 39 to line 427, col 39 of module Alias
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 26, col 11 to line 26, col 11 of module Alias.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 427, col 48 to line 427, col 48 of module Alias
    | The field name "y" in the record constructor is identical to the existing definition or declaration
    | named y, located at line 26, col 14 to line 26, col 14 of module Alias.
    | The field in the record will not take the value of the y definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [y |-> ...] = {"y"} holds true.
    | line 428, col 39 to line 428, col 39 of module Alias
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 26, col 11 to line 26, col 11 of module Alias.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 428, col 48 to line 428, col 48 of module Alias
    | The field name "y" in the record constructor is identical to the existing definition or declaration
    | named y, located at line 26, col 14 to line 26, col 14 of module Alias.
    | The field in the record will not take the value of the y definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [y |-> ...] = {"y"} holds true.
    | line 429, col 39 to line 429, col 39 of module Alias
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 26, col 11 to line 26, col 11 of module Alias.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 429, col 48 to line 429, col 48 of module Alias
    | The field name "y" in the record constructor is identical to the existing definition or declaration
    | named y, located at line 26, col 14 to line 26, col 14 of module Alias.
    | The field in the record will not take the value of the y definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [y |-> ...] = {"y"} holds true.
    | line 436, col 42 to line 436, col 42 of module Alias
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 26, col 11 to line 26, col 11 of module Alias.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 436, col 51 to line 436, col 51 of module Alias
    | The field name "y" in the record constructor is identical to the existing definition or declaration
    | named y, located at line 26, col 14 to line 26, col 14 of module Alias.
    | The field in the record will not take the value of the y definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [y |-> ...] = {"y"} holds true.
    | line 444, col 42 to line 444, col 42 of module Alias
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 26, col 11 to line 26, col 11 of module Alias.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 444, col 51 to line 444, col 51 of module Alias
    | The field name "y" in the record constructor is identical to the existing definition or declaration
    | named y, located at line 26, col 14 to line 26, col 14 of module Alias.
    | The field in the record will not take the value of the y definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [y |-> ...] = {"y"} holds true.
    | line 446, col 39 to line 446, col 39 of module Alias
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 26, col 11 to line 26, col 11 of module Alias.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
    | line 446, col 48 to line 446, col 48 of module Alias
    | The field name "y" in the record constructor is identical to the existing definition or declaration
    | named y, located at line 26, col 14 to line 26, col 14 of module Alias.
    | The field in the record will not take the value of the y definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [y |-> ...] = {"y"} holds true.
    2212:0 Implied-temporal checking--satisfiability problem has 2 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking 2 branches of temporal properties for the complete state space with 8 total distinct states at (<date>)
    2116:1 Temporal property Prop was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    /\ yy = FALSE
    /\ x = 1
    /\ a = 0
    /\ b = TRUE
    /\ anim = "e1: 1 e2: FALSE"
    /\ te = TRUE
    /\ lvl = <<1, 1>>
    /\ trc = <<[x |-> 1, y |-> FALSE]>>
    2218:4 2: Stuttering
    2404:1 Postcondition PostConditionStuttering at line 434, col 9 to line 446, col 65 of module Alias is false.
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 5 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 4.
---*)
