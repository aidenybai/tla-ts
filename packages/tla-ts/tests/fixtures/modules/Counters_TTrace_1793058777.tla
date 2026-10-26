---- MODULE Counters_TTrace_1793058777 ----
EXTENDS Sequences, TLCExt, Toolbox, Naturals, TLC, Counters

_expression ==
    LET Counters_TEExpression == INSTANCE Counters_TEExpression
    IN Counters_TEExpression!expression
----

_trace ==
    LET Counters_TETrace == INSTANCE Counters_TETrace
    IN Counters_TETrace!trace
----

_inv ==
    ~(
        TLCGet("level") = Len(_TETrace)
        /\
        a = (3)
        /\
        b = (4)
    )
----

_init ==
    /\ a = _TETrace[1].a
    /\ b = _TETrace[1].b
----

_next ==
    /\ \E i,j \in DOMAIN _TETrace:
        /\ \/ /\ j = i + 1
              /\ i = TLCGet("level")
        /\ a  = _TETrace[i].a
        /\ a' = _TETrace[j].a
        /\ b  = _TETrace[i].b
        /\ b' = _TETrace[j].b

\* Uncomment the ASSUME below to write the states of the error trace
\* to the given file in Json format. Note that you can pass any tuple
\* to `JsonSerialize`. For example, a sub-sequence of _TETrace.
    \* ASSUME
    \*     LET J == INSTANCE Json
    \*         IN J!JsonSerialize("Counters_TTrace_1793058777.json", _TETrace)

=============================================================================

 Note that you can extract this module `Counters_TEExpression`
  to a dedicated file to reuse `expression` (the module in the 
  dedicated `Counters_TEExpression.tla` file takes precedence 
  over the module `Counters_TEExpression` below).

---- MODULE Counters_TEExpression ----
EXTENDS Sequences, TLCExt, Toolbox, Naturals, TLC, Counters

expression == 
    [
        \* To hide variables of the `Counters` spec from the error trace,
        \* remove the variables below.  The trace will be written in the order
        \* of the fields of this record.
        a |-> a
        ,b |-> b
        
        \* Put additional constant-, state-, and action-level expressions here:
        \* ,_stateNumber |-> _TEPosition
        \* ,_aUnchanged |-> a = a'
        
        \* Format the `a` variable as Json value.
        \* ,_aJson |->
        \*     LET J == INSTANCE Json
        \*     IN J!ToJson(a)
        
        \* Lastly, you may build expressions over arbitrary sets of states by
        \* leveraging the _TETrace operator.  For example, this is how to
        \* count the number of times a spec variable changed up to the current
        \* state in the trace.
        \* ,_aModCount |->
        \*     LET F[s \in DOMAIN _TETrace] ==
        \*         IF s = 1 THEN 0
        \*         ELSE IF _TETrace[s].a # _TETrace[s-1].a
        \*             THEN 1 + F[s-1] ELSE F[s-1]
        \*     IN F[_TEPosition - 1]
    ]

=============================================================================



Parsing and semantic processing can take forever if the trace below is long.
 In this case, it is advised to uncomment the module below to deserialize the
 trace from a generated binary file.

\*
\*---- MODULE Counters_TETrace ----
\*EXTENDS IOUtils, TLC, Counters
\*
\*trace == IODeserialize("Counters_TTrace_1793058777.bin", TRUE)
\*
\*=============================================================================
\*

---- MODULE Counters_TETrace ----
EXTENDS TLC, Counters

trace == 
    <<
    ([a |-> 0,b |-> 0]),
    ([a |-> 1,b |-> 0]),
    ([a |-> 3,b |-> 0]),
    ([a |-> 3,b |-> 2]),
    ([a |-> 3,b |-> 4])
    >>
----


=============================================================================

---- CONFIG Counters_TTrace_1793058777 ----

INVARIANT
    _inv

CHECK_DEADLOCK
    \* CHECK_DEADLOCK off because of PROPERTY or INVARIANT above.
    FALSE

INIT
    _init

NEXT
    _next

CONSTANT
    _TETrace <- _trace

ALIAS
    _expression
=============================================================================
\* Generated on Mon Oct 26 16:52:57 PDT 2026