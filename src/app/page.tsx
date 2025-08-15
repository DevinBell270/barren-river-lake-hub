// src/app/page.tsx
'use client';
import * as React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

// --- Constants for Pool Levels ---
const WINTER_POOL = 525.00;
const SUMMER_POOL = 552.00;
const FLOOD_POOL = 590.00;

// --- Data Type Definitions ---
interface LakeData {
    level: number | null;
    inflow: number | null;
    outflow: number | null;
    waterTemp: number | null;
    rain24h: number | null;
    lastUpdated: string | null;
}

interface WeatherData {
    temperature: number;
    windSpeed: string;
    windDirection: string;
    shortForecast: string;
    lastUpdated: string;
}

// --- Components ---

function LakeLevelGauge({ currentLevel, lastUpdated }: { currentLevel: number; lastUpdated: string }) {
    const progress = (currentLevel / FLOOD_POOL) * 100;
    const summerPoolPosition = (SUMMER_POOL / FLOOD_POOL) * 100;
    const winterPoolPosition = (WINTER_POOL / FLOOD_POOL) * 100;

    return (
        <Box sx={{ width: '100%', p: 2 }}>
            <Typography variant="h6" color="text.secondary" align="center">
                Current Lake Level
            </Typography>
            <Typography component="p" variant="h2" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                {currentLevel.toFixed(2)} ft
            </Typography>
            <Box sx={{ position: 'relative', mt: 2, mb: 4 }}>
                <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 5 }} />
                <Box sx={{ position: 'absolute', left: `${summerPoolPosition}%`, top: -25, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Summer</Typography>
                    <Box sx={{ height: 35, borderLeft: '2px solid grey', width: '1px' }} />
                </Box>
                <Box sx={{ position: 'absolute', left: `${winterPoolPosition}%`, top: -25, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Winter</Typography>
                    <Box sx={{ height: 35, borderLeft: '2px solid grey', width: '1px' }} />
                </Box>
            </Box>
            <Typography color="text.secondary" align="center">
                Updated: {new Date(lastUpdated).toLocaleTimeString()}
            </Typography>
        </Box>
    );
}

function WeatherCard() {
    const [weather, setWeather] = React.useState<WeatherData | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetchWeatherData() {
            try {
                setLoading(true);
                const response = await fetch('/api/weather');
                const result = await response.json();
                setWeather(result);
            } catch (error) {
                console.error("Failed to fetch weather data", error);
            } finally {
                setLoading(false);
            }
        }
        fetchWeatherData();
    }, []);

    return (
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 180 }}>
            <Typography variant="h6" color="text.secondary">Weather</Typography>
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}><CircularProgress /></Box>
            ) : weather ? (
                <Box>
                    <Typography component="p" variant="h4" sx={{ fontWeight: 'bold' }}>
                        {weather.temperature}°F
                    </Typography>
                    <Typography color="text.secondary">
                        {weather.shortForecast}
                    </Typography>
                    <Typography color="text.secondary">
                        Wind: {weather.windDirection} {weather.windSpeed}
                    </Typography>
                </Box>
            ) : (
                <Typography color="error">Could not load weather.</Typography>
            )}
        </Paper>
    );
}

export default function HomePage() {
    const [data, setData] = React.useState<LakeData | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const response = await fetch('/api/lake-data');
                const result = await response.json();
                setData(result);
            } catch (error) {
                console.error("Failed to fetch lake data", error);
                setData(null);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const renderMetric = (title: string, value: number | null | undefined, unit: string) => (
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 180 }}>
            <Typography variant="h6" color="text.secondary">{title}</Typography>
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}><CircularProgress /></Box>
            ) : (
                <Typography component="p" variant="h4" sx={{ fontWeight: 'bold', mt: 2 }}>
                    {value != null ? `${value.toFixed(0)} ${unit}` : 'N/A'}
                </Typography>
            )}
        </Paper>
    );

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Barren River Lake Hub
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 240, justifyContent: 'center', alignItems: 'center' }}>
                        {loading ? <CircularProgress size={60} /> : (
                            data?.level && data.lastUpdated ? (
                                <LakeLevelGauge currentLevel={data.level} lastUpdated={data.lastUpdated} />
                            ) : (
                                <Typography color="error">Could not load lake level data.</Typography>
                            )
                        )}
                    </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>{renderMetric('Inflow', data?.inflow, 'cfs')}</Grid>
                <Grid item xs={12} sm={6} md={3}>{renderMetric('Outflow', data?.outflow, 'cfs')}</Grid>
                {/* New Weather Card */}
                <Grid item xs={12} sm={6} md={3}><WeatherCard /></Grid>
                <Grid item xs={12} sm={6} md={3}>{renderMetric('24hr Rain', data?.rain24h, 'in')}</Grid>
            </Grid>
        </Container>
    );
}
