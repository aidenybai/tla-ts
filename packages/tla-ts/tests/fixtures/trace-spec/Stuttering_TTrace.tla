---- MODULE te ----
EXTENDS Sequences, TLCExt, Stuttering, Stuttering_TEConstants, Toolbox, Naturals, TLC

_expression ==
    LET Stuttering_TEExpression == INSTANCE Stuttering_TEExpression
    IN Stuttering_TEExpression!expression
----

_trace ==
    LET Stuttering_TETrace == INSTANCE Stuttering_TETrace
    IN Stuttering_TETrace!trace
----

_prop ==
    ~<>[](
        pc = ((a :> "idle" @@ b :> "done"))
        /\
        count = (1)
    )
----

_init ==
    /\ pc = _TETrace[1].pc
    /\ count = _TETrace[1].count
----

_next ==
    /\ \E i,j \in DOMAIN _TETrace:
        /\ \/ /\ j = i + 1
              /\ i = TLCGet("level")
        /\ pc  = _TETrace[i].pc
        /\ pc' = _TETrace[j].pc
        /\ count  = _TETrace[i].count
        /\ count' = _TETrace[j].count

\* Uncomment the ASSUME below to write the states of the error trace
\* to the given file in Json format. Note that you can pass any tuple
\* to `JsonSerialize`. For example, a sub-sequence of _TETrace.
    \* ASSUME
    \*     LET J == INSTANCE Json
    \*         IN J!JsonSerialize("te.json", _TETrace)

=============================================================================

 Note that you can extract this module `Stuttering_TEExpression`
  to a dedicated file to reuse `expression` (the module in the 
  dedicated `Stuttering_TEExpression.tla` file takes precedence 
  over the module `Stuttering_TEExpression` below).

---- MODULE Stuttering_TEExpression ----
EXTENDS Sequences, TLCExt, Stuttering, Stuttering_TEConstants, Toolbox, Naturals, TLC

expression == 
    [
        \* To hide variables of the `Stuttering` spec from the error trace,
        \* remove the variables below.  The trace will be written in the order
        \* of the fields of this record.
        pc |-> pc
        ,count |-> count
        
        \* Put additional constant-, state-, and action-level expressions here:
        \* ,_stateNumber |-> _TEPosition
        \* ,_pcUnchanged |-> pc = pc'
        
        \* Format the `pc` variable as Json value.
        \* ,_pcJson |->
        \*     LET J == INSTANCE Json
        \*     IN J!ToJson(pc)
        
        \* Lastly, you may build expressions over arbitrary sets of states by
        \* leveraging the _TETrace operator.  For example, this is how to
        \* count the number of times a spec variable changed up to the current
        \* state in the trace.
        \* ,_pcModCount |->
        \*     LET F[s \in DOMAIN _TETrace] ==
        \*         IF s = 1 THEN 0
        \*         ELSE IF _TETrace[s].pc # _TETrace[s-1].pc
        \*             THEN 1 + F[s-1] ELSE F[s-1]
        \*     IN F[_TEPosition - 1]
    ]

=============================================================================



Parsing and semantic processing can take forever if the trace below is long.
 In this case, it is advised to uncomment the module below to deserialize the
 trace from a generated binary file.

\*
\*---- MODULE Stuttering_TETrace ----
\*EXTENDS IOUtils, Stuttering, Stuttering_TEConstants, TLC
\*
\*trace == IODeserialize("te.bin", TRUE)
\*
\*=============================================================================
\*

---- MODULE Stuttering_TETrace ----
EXTENDS Stuttering, Stuttering_TEConstants, TLC

trace == 
    <<
    ([pc |-> (a :> "idle" @@ b :> "idle"),count |-> 0]),
    ([pc |-> (a :> "idle" @@ b :> "done"),count |-> 1])
    >>
----


=============================================================================

---- MODULE Stuttering_TEConstants ----
EXTENDS Stuttering

CONSTANTS a, b

=============================================================================

---- CONFIG te ----
CONSTANTS
    Procs = { a , b }
    a = a
    b = b

PROPERTY
    _prop

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
\* Generated on Mon Nov 09 22:26:22 PST 2026