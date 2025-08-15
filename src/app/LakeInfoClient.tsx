// src/app/LakeInfoClient.tsx
'use client';
import * as React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import { styled } from '@mui/material/styles';

// --- Material UI Icons ---
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterIcon from '@mui/icons-material/Water';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import NavigationIcon from '@mui/icons-material/Navigation';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import OpacityIcon from '@mui/icons-material/Opacity';
import TimelineIcon from '@mui/icons-material/Timeline';

// --- SWR Hooks ---
import { useLakeLevel, useOutflowData, useWeatherData } from '@/hooks/useLakeData';



// --- Constants for Pool Levels ---
const WINTER_POOL = 525.00;
const SUMMER_POOL = 552.00;
const FLOOD_POOL = 590.00;

// --- Styled Components for Modern Design ---
const HeroCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.primary.main}08 100%)`,
  borderRadius: 16,
  border: `1px solid ${theme.palette.primary.main}20`,
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  overflow: 'visible',
}));

const ModernCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    transform: 'translateY(-2px)',
  },
}));

const LakeGauge = styled(Box)(({ theme }) => {
  // Calculate the positions for the color zones
  // Winter Pool: 525 ft, Summer Pool: 552 ft, Flood Pool: 590 ft
  const gaugeRange = 590 - 525; // 65 ft total range
  const summerPoolStart = ((552 - 525) / gaugeRange) * 100; // ~41.5%
  
  return {
    position: 'relative',
    height: 12,
    borderRadius: 6,
    background: `linear-gradient(to right, 
      ${theme.palette.info.light} 0%, 
      ${theme.palette.info.light} ${summerPoolStart}%, 
      ${theme.palette.success.main} ${summerPoolStart}%, 
      ${theme.palette.success.main} 80%, 
      ${theme.palette.warning.main} 80%, 
      ${theme.palette.error.main} 100%)`,
    overflow: 'hidden',
  };
});

// --- Data Type Definitions ---
interface LakeData {
    level: number | null;
    waterTemp: number | null;
    rain24h: number | null;
    lastUpdated: string | null;
    // Added for trend indicator
    levelTrend: {
        change: number;
        direction: 'up' | 'down' | 'steady';
    } | null;
}





interface WeatherData {
    temperature: number;
    windSpeed: string;
    windDirection: string;
    shortForecast: string;
    forecast?: Array<{
        name: string;
        shortForecast: string;
        temperature: number;
    }>;
    lastUpdated: string;
}

interface OutflowData {
    outflow: number;
    lastUpdated: string;
    note: string;
}

interface LakeInfoClientProps {
    fallbackLakeData?: any;
    fallbackOutflowData?: OutflowData;
}

// --- Components ---
function HeroSection({ lakeData, weatherData, isLoading }: { 
    lakeData: LakeData | null; 
    weatherData: WeatherData | null; 
    isLoading: boolean 
}) {
    if (isLoading) {
        return (
            <HeroCard>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <CircularProgress size={60} />
                    <Typography color="text.secondary" sx={{ mt: 2 }}>
                        Loading lake conditions...
                    </Typography>
                </CardContent>
            </HeroCard>
        );
    }

    if (!lakeData?.level) {
        return (
            <HeroCard>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="error">
                        Could not load lake data
                    </Typography>
                </CardContent>
            </HeroCard>
        );
    }

    const currentLevel = lakeData.level;
    
    // Calculate gauge positions relative to the actual range (Winter Pool to Flood Pool)
    const gaugeRange = FLOOD_POOL - WINTER_POOL;
    const progress = ((currentLevel - WINTER_POOL) / gaugeRange) * 100;
    const summerPoolPosition = ((SUMMER_POOL - WINTER_POOL) / gaugeRange) * 100;
    const winterPoolPosition = 0; // Winter pool is at the start
    const floodPoolPosition = 100; // Flood pool is at the end

    // Calculate human-readable status based on season
    const getPoolStatus = () => {
        const now = new Date();
        const month = now.getMonth(); // 0 = January, 11 = December
        
        // Summer season: April 1 - September 30 (months 3-8)
        // Winter season: October 1 - March 31 (months 9-2)
        const isSummerSeason = month >= 3 && month <= 8;
        
        if (isSummerSeason) {
            // During summer season, reference Summer Pool
            const diffFromSummer = currentLevel - SUMMER_POOL;
            if (Math.abs(diffFromSummer) < 0.5) return "At Summer Pool";
            if (diffFromSummer > 0) return `${diffFromSummer.toFixed(1)} ft Above Summer Pool`;
            return `${Math.abs(diffFromSummer).toFixed(1)} ft Below Summer Pool`;
        } else {
            // During winter season, reference Winter Pool
            const diffFromWinter = currentLevel - WINTER_POOL;
            if (Math.abs(diffFromWinter) < 0.5) return "At Winter Pool";
            if (diffFromWinter > 0) return `${diffFromWinter.toFixed(1)} ft Above Winter Pool`;
            return `${Math.abs(diffFromWinter).toFixed(1)} ft Below Winter Pool`;
        }
    };

    const getStatusColor = () => {
        const now = new Date();
        const month = now.getMonth();
        const isSummerSeason = month >= 3 && month <= 8;
        
        if (isSummerSeason) {
            // Summer season color logic
            if (currentLevel > SUMMER_POOL + 5) return 'warning.main'; // High
            if (currentLevel >= SUMMER_POOL - 2) return 'success.main'; // Normal range
            return 'info.main'; // Below normal
        } else {
            // Winter season color logic
            if (currentLevel > WINTER_POOL + 10) return 'warning.main'; // High for winter
            if (currentLevel >= WINTER_POOL - 2) return 'success.main'; // Normal range
            return 'info.main'; // Below normal
        }
    };

    // Calculate feels like temperature (simplified formula)
    const getFeelsLike = (temp: number) => {
        return Math.round(temp + 2); // Simplified - usually feels slightly warmer in sun
    };

    // Extract wind speed number
    const getWindSpeed = (windSpeed: string) => {
        const match = windSpeed.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
    };

    // Mock UV index (in real app, would come from weather API)
    const uvIndex = 9;
    const getUVStatus = (uv: number) => {
        if (uv >= 8) return { status: 'Very High', color: 'error.main' };
        if (uv >= 6) return { status: 'High', color: 'warning.main' };
        if (uv >= 3) return { status: 'Moderate', color: 'info.main' };
        return { status: 'Low', color: 'success.main' };
    };

    return (
        <HeroCard>
            <CardContent sx={{ p: 4 }}>
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
                        Barren River Lake
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            Updated: {new Date(lakeData.lastUpdated || '').toLocaleString()}
                        </Typography>
                        <Chip 
                            label={(() => {
                                const month = new Date().getMonth();
                                return month >= 3 && month <= 8 ? 'Summer Pool Season' : 'Winter Pool Season';
                            })()} 
                            size="small" 
                            variant="outlined"
                            color={(() => {
                                const month = new Date().getMonth();
                                return month >= 3 && month <= 8 ? 'success' : 'info';
                            })()}
                        />
                    </Box>
                </Box>

                {/* Main Lake Level Display */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
                        <Typography variant="h1" component="div" sx={{ 
                            fontWeight: 800, 
                            fontSize: { xs: '3rem', sm: '4rem' },
                            color: 'primary.main'
                        }}>
                            {currentLevel.toFixed(2)} ft
                        </Typography>
                        {lakeData.levelTrend && lakeData.levelTrend.direction !== 'steady' && (
                            <Chip
                                icon={lakeData.levelTrend.direction === 'up' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                                label={`${lakeData.levelTrend.direction === 'up' ? '+' : ''}${lakeData.levelTrend.change.toFixed(2)} ft (24hr)`}
                                color={lakeData.levelTrend.direction === 'up' ? 'warning' : 'success'}
                                variant="outlined"
                            />
                        )}
                    </Box>
                    
                    <Typography variant="h6" sx={{ 
                        color: getStatusColor(), 
                        fontWeight: 600,
                        mb: 3
                    }}>
                        {getPoolStatus()}
                    </Typography>

                    {/* Improved Gauge */}
                    <Box sx={{ position: 'relative', mx: 2 }}>
                        <LakeGauge>
                            <Box sx={{
                                position: 'absolute',
                                left: `${progress}%`,
                                top: -2,
                                width: 16,
                                height: 16,
                                backgroundColor: 'primary.main',
                                borderRadius: '50%',
                                border: '2px solid white',
                                boxShadow: 2,
                                transform: 'translateX(-50%)'
                            }} />
                        </LakeGauge>
                        
                        {/* Pool Level Labels */}
                        <Box sx={{ position: 'relative', mt: 2, px: 1, height: 32 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ 
                                position: 'absolute', 
                                left: `${winterPoolPosition}%`, 
                                transform: 'translateX(-50%)',
                                textAlign: 'center'
                            }}>
                                Winter Pool<br/>{WINTER_POOL} ft
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ 
                                position: 'absolute', 
                                left: `${summerPoolPosition}%`, 
                                transform: 'translateX(-50%)',
                                textAlign: 'center'
                            }}>
                                Summer Pool<br/>{SUMMER_POOL} ft
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ 
                                position: 'absolute', 
                                left: `${floodPoolPosition}%`, 
                                transform: 'translateX(-50%)',
                                textAlign: 'center'
                            }}>
                                Flood Stage<br/>{FLOOD_POOL} ft
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Weather Integration */}
                {weatherData && (
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-around',
                        alignItems: 'center',
                        p: 2,
                        backgroundColor: 'rgba(255,255,255,0.5)',
                        borderRadius: 2,
                        flexWrap: 'wrap',
                        gap: 2
                    }}>
                        {/* Temperature */}
                        <Box sx={{ textAlign: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                                <ThermostatIcon color="primary" />
                                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                    {weatherData.temperature}°F
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Feels like {getFeelsLike(weatherData.temperature)}°F
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {weatherData.shortForecast}
                            </Typography>
                        </Box>

                        {/* Wind */}
                        <Box sx={{ textAlign: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                                <NavigationIcon color="primary" sx={{ 
                                    transform: weatherData.windDirection === 'N' ? 'rotate(0deg)' : 
                                             weatherData.windDirection === 'S' ? 'rotate(180deg)' :
                                             weatherData.windDirection === 'E' ? 'rotate(90deg)' :
                                             weatherData.windDirection === 'W' ? 'rotate(270deg)' : 'rotate(45deg)'
                                }} />
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    {getWindSpeed(weatherData.windSpeed)} mph
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Wind from {weatherData.windDirection}
                            </Typography>
                        </Box>

                        {/* UV Index */}
                        <Box sx={{ textAlign: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                                <WbSunnyIcon color="primary" />
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    UV {uvIndex}
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ color: getUVStatus(uvIndex).color }}>
                                {getUVStatus(uvIndex).status}
                            </Typography>
                        </Box>
                    </Box>
                )}
            </CardContent>
        </HeroCard>
    );
}

function DetailedWeatherCard() {
    const { data: weather, error, isLoading } = useWeatherData();

    const getWeatherIcon = (forecast: string) => {
        if (forecast.toLowerCase().includes('sunny') || forecast.toLowerCase().includes('clear')) {
            return <WbSunnyIcon />;
        } else if (forecast.toLowerCase().includes('cloud')) {
            return <CloudQueueIcon />;
        }
        return <WbSunnyIcon />;
    };

    return (
        <ModernCard>
            <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
                    Weather Forecast
                </Typography>
                
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Typography color="error">Could not load weather.</Typography>
                ) : weather ? (
                    <Box>
                        {/* Hourly Forecast */}
                        {weather.forecast && weather.forecast.length > 0 && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                    Upcoming Periods
                                </Typography>
                                <Box sx={{ 
                                    display: 'flex', 
                                    gap: 2, 
                                    overflowX: 'auto',
                                    pb: 1,
                                    '&::-webkit-scrollbar': { height: 4 },
                                    '&::-webkit-scrollbar-thumb': { 
                                        backgroundColor: 'rgba(0,0,0,0.2)', 
                                        borderRadius: 2 
                                    }
                                }}>
                                    {weather.forecast.slice(0, 3).map((period, index) => (
                                        <Box key={index} sx={{ 
                                            minWidth: 80, 
                                            textAlign: 'center',
                                            p: 1,
                                            backgroundColor: 'rgba(0,0,0,0.03)',
                                            borderRadius: 1
                                        }}>
                                            <Typography variant="caption" color="text.secondary">
                                                {period.name}
                                            </Typography>
                                            <Box sx={{ my: 1 }}>
                                                {getWeatherIcon(period.shortForecast)}
                                            </Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {period.temperature}°
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {/* Rain Information */}
                        <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            p: 2,
                            backgroundColor: 'rgba(0,0,0,0.03)',
                            borderRadius: 1
                        }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    24hr Rain: <strong>0 in</strong>
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Chance of Rain Today: <strong>10%</strong>
                                </Typography>
                            </Box>
                            <CloudQueueIcon color="action" />
                        </Box>
                    </Box>
                ) : (
                    <Typography color="error">Could not load weather.</Typography>
                )}
            </CardContent>
        </ModernCard>
    );
}

function LakeConditionsCard({ lakeData, outflowData, isLoading }: { 
    lakeData: LakeData | null; 
    outflowData: OutflowData | null; 
    isLoading: boolean 
}) {
    const getOutflowContext = (outflow: number) => {
        if (outflow < 500) return { status: 'Low Generation', color: 'info.main' };
        if (outflow < 1500) return { status: 'Normal Generation', color: 'success.main' };
        if (outflow < 3000) return { status: 'High Generation', color: 'warning.main' };
        return { status: 'Flood Generation', color: 'error.main' };
    };

    const getWaterTempContext = (temp: number) => {
        if (temp < 60) return { status: 'Cold', color: 'info.main' };
        if (temp < 75) return { status: 'Cool', color: 'primary.main' };
        if (temp < 85) return { status: 'Warm', color: 'success.main' };
        return { status: 'Hot', color: 'warning.main' };
    };

    return (
        <ModernCard>
            <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
                    Lake & Fishing Conditions
                </Typography>
                
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box sx={{ space: 'y-3' }}>
                        {/* Water Temperature */}
                        {lakeData?.waterTemp && (
                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                p: 2,
                                backgroundColor: 'rgba(0,0,0,0.03)',
                                borderRadius: 1,
                                mb: 2
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <ThermostatIcon color="primary" />
                                    <Box>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                            Water Temperature
                                        </Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                            {lakeData.waterTemp}°F
                                        </Typography>
                                    </Box>
                                </Box>
                                <Chip 
                                    label={getWaterTempContext(lakeData.waterTemp).status} 
                                    sx={{ 
                                        color: getWaterTempContext(lakeData.waterTemp).color,
                                        backgroundColor: 'transparent',
                                        border: `1px solid ${getWaterTempContext(lakeData.waterTemp).color}`
                                    }}
                                    variant="outlined"
                                    size="small"
                                />
                            </Box>
                        )}

                        {/* Outflow */}
                        {outflowData && (
                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                p: 2,
                                backgroundColor: 'rgba(0,0,0,0.03)',
                                borderRadius: 1,
                                mb: 2
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <TimelineIcon color="primary" />
                                    <Box>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                            Outflow
                                        </Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                            {outflowData.outflow.toLocaleString()} cfs
                                        </Typography>
                                    </Box>
                                </Box>
                                <Chip 
                                    label={getOutflowContext(outflowData.outflow).status} 
                                    sx={{ 
                                        color: getOutflowContext(outflowData.outflow).color,
                                        backgroundColor: 'transparent',
                                        border: `1px solid ${getOutflowContext(outflowData.outflow).color}`
                                    }}
                                    variant="outlined"
                                    size="small"
                                />
                            </Box>
                        )}

                        {/* Water Clarity */}
                        <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            p: 2,
                            backgroundColor: 'rgba(0,0,0,0.03)',
                            borderRadius: 1
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <OpacityIcon color="primary" />
                                <Box>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                        Water Clarity
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                        Clear
                                    </Typography>
                                </Box>
                            </Box>
                            <Chip 
                                label="Good Visibility" 
                                color="success"
                                variant="outlined"
                                size="small"
                            />
                        </Box>
                    </Box>
                )}
            </CardContent>
        </ModernCard>
    );
}

export function LakeInfoClient({ 
    fallbackLakeData, 
    fallbackOutflowData
}: LakeInfoClientProps) {
    // Use SWR hooks with fallback data from server
    const { data: lakeData, error: lakeError, isLoading: isLakeLoading } = useLakeLevel(fallbackLakeData);
    const { data: outflowData, isLoading: isOutflowLoading } = useOutflowData(fallbackOutflowData);
    const { data: weatherData, isLoading: isWeatherLoading } = useWeatherData();

    // Add mock trend data until API is updated
    const data = React.useMemo(() => {
        if (!lakeData) return null;
        
        const mockTrend = {
            change: 0.15,
            direction: 'up' as 'up' | 'down' | 'steady'
        };
        
        return { ...lakeData, levelTrend: mockTrend };
    }, [lakeData]);

    return (
        <Container maxWidth="lg" sx={{ 
            mt: 2, 
            mb: 4, 
            backgroundColor: 'transparent',
            minHeight: '100vh'
        }}>
            {/* Hero Section */}
            <Box sx={{ mb: 4 }}>
                <HeroSection 
                    lakeData={data} 
                    weatherData={weatherData} 
                    isLoading={isLakeLoading || isWeatherLoading}
                />
            </Box>

            {/* Secondary Cards */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <DetailedWeatherCard />
                </Grid>
                <Grid item xs={12} md={6}>
                    <LakeConditionsCard 
                        lakeData={data}
                        outflowData={outflowData}
                        isLoading={isLakeLoading || isOutflowLoading}
                    />
                </Grid>
            </Grid>
        </Container>
    );
}
